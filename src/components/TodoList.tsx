import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Todo {
  id: string;
  task: string;
  completed: boolean | null;
}

interface TodoListProps {
  todos: Todo[];
  onAddTodo: (task: string) => void;
  onToggleTodo: (id: string, completed: boolean) => void;
  onDeleteTodo: (id: string) => void;
  dateLabel: string;
}

const TodoList = ({ todos, onAddTodo, onToggleTodo, onDeleteTodo, dateLabel }: TodoListProps) => {
  const [newTask, setNewTask] = useState('');
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const handleAdd = () => {
    if (newTask.trim()) {
      onAddTodo(newTask.trim());
      setNewTask('');
    }
  };

  const handleToggle = (id: string, current: boolean | null) => {
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 300);
    onToggleTodo(id, !current);
  };

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-serif font-semibold text-foreground">{dateLabel}</h2>
        {todos.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {completedCount}/{todos.length} done
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Add a task..."
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="rounded-xl border-border bg-card/50"
        />
        <Button size="icon" onClick={handleAdd} className="rounded-xl shrink-0">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {todos.length === 0 ? (
        <div className="glass rounded-2xl p-8 text-center">
          <p className="text-muted-foreground text-sm">No tasks for today. Enjoy the peace ✨</p>
        </div>
      ) : (
        <div className="space-y-2">
          {todos.map(todo => (
            <div
              key={todo.id}
              className={cn(
                'glass rounded-xl p-3 flex items-center gap-3 group transition-all duration-200',
                todo.completed && 'opacity-60'
              )}
            >
              <button
                onClick={() => handleToggle(todo.id, todo.completed)}
                className={cn(
                  'w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all shrink-0',
                  todo.completed
                    ? 'bg-primary border-primary'
                    : 'border-border hover:border-primary/50',
                  animatingId === todo.id && 'animate-check-pop'
                )}
              >
                {todo.completed && <Check className="w-3 h-3 text-primary-foreground" />}
              </button>
              <span className={cn(
                'flex-1 text-sm text-foreground transition-all',
                todo.completed && 'line-through text-muted-foreground'
              )}>
                {todo.task}
              </span>
              <button
                onClick={() => onDeleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoList;
