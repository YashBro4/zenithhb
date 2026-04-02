import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Camera, User } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileSettingsProps {
  onBack: () => void;
}

const ProfileSettings = ({ onBack }: ProfileSettingsProps) => {
  const { user, isGuest } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Sync state when profile loads
  useState(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  });

  const updateProfile = useMutation({
    mutationFn: async ({ display_name, avatar_url }: { display_name: string; avatar_url?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name, avatar_url })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated!');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Store the storage path, not a public URL
      const storagePath = path;
      setAvatarUrl(storagePath);
      await updateProfile.mutateAsync({ display_name: displayName, avatar_url: storagePath });
    } catch (err) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    updateProfile.mutate({ display_name: displayName, avatar_url: avatarUrl });
  };

  if (isGuest) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 rounded-lg">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-lg font-serif font-semibold text-foreground">Profile Settings</h2>
        </div>
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-muted-foreground text-sm">Sign in to customize your profile</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentName = displayName || profile?.display_name || '';
  const currentAvatar = avatarUrl || profile?.avatar_url || '';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 rounded-lg">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-serif font-semibold text-foreground">Profile Settings</h2>
      </div>

      <div className="glass rounded-2xl p-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden">
              {currentAvatar ? (
                <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          {uploading && <p className="text-xs text-muted-foreground">Uploading...</p>}
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Display Name</label>
          <Input
            value={currentName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="rounded-xl border-border bg-background/50"
          />
        </div>

        {/* Email (read-only) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input
            value={user?.email || ''}
            disabled
            className="rounded-xl border-border bg-muted/50 text-muted-foreground"
          />
        </div>

        <Button onClick={handleSave} disabled={updateProfile.isPending} className="w-full rounded-xl">
          {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default ProfileSettings;
