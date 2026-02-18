import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFinance, TransactionType, AccountType } from '@/contexts/FinanceContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// Emojis organizados por categoria para facilitar a busca
const emojiCategories = {
  'Dinheiro': ['💰', '💵', '💴', '💶', '💷', '💸', '💳', '🏦', '💹', '📈', '📉', '📊', '🪙', '💎', '🏧'],
  'Compras': ['🛒', '🛍️', '🏬', '🏪', '🛒', '🧾', '🎁', '📦', '🏷️', '💳'],
  'Casa': ['🏠', '🏡', '🏢', '🔑', '🛋️', '🛏️', '🚿', '🧹', '💡', '🔌', '📺', '🌡️'],
  'Alimentação': ['🍔', '🍕', '🍗', '🥗', '🍜', '🍣', '🍰', '☕', '🍺', '🥤', '🍽️', '🥡', '🧁', '🍳'],
  'Transporte': ['🚗', '🚕', '🚌', '🚇', '✈️', '🚲', '⛽', '🅿️', '🚂', '🛵', '🚁', '⛵', '🛴'],
  'Saúde': ['🏥', '💊', '💉', '🩺', '🩹', '🏋️', '🧘', '🚴', '🏃', '❤️‍🩹', '🦷', '👨‍⚕️'],
  'Educação': ['📚', '📖', '✏️', '🎓', '🏫', '📝', '🖊️', '📐', '🧮', '💻', '🎒'],
  'Lazer': ['🎮', '🎬', '🎵', '🎤', '🎸', '🎯', '🎲', '🎨', '📺', '🎭', '🎪', '🎠', '🎡'],
  'Viagem': ['✈️', '🏖️', '🗺️', '🧳', '🏔️', '🏕️', '🌴', '🌎', '🛫', '🏨', '📸', '🎢'],
  'Trabalho': ['💼', '🔧', '📊', '📋', '📁', '🖥️', '💻', '📱', '📞', '📧', '🏢', '👔', '🤝'],
  'Pets': ['🐕', '🐈', '🐦', '🐠', '🐹', '🐰', '🦜', '🐾', '🦴', '🐶', '😺'],
  'Outros': ['⭐', '❤️', '🎀', '🔔', '📌', '✨', '🌟', '💫', '🎉', '🎊', '📍', '🔖'],
};

const categoryColors = [
  { color: 'hsl(152, 69%, 40%)', name: 'Verde' },
  { color: 'hsl(217, 91%, 60%)', name: 'Azul' },
  { color: 'hsl(24, 95%, 53%)', name: 'Laranja' },
  { color: 'hsl(262, 83%, 58%)', name: 'Roxo' },
  { color: 'hsl(340, 82%, 52%)', name: 'Rosa' },
  { color: 'hsl(199, 89%, 48%)', name: 'Ciano' },
  { color: 'hsl(38, 92%, 50%)', name: 'Amarelo' },
  { color: 'hsl(0, 84%, 60%)', name: 'Vermelho' },
  { color: 'hsl(160, 84%, 39%)', name: 'Teal' },
  { color: 'hsl(224, 71%, 40%)', name: 'Índigo' },
  { color: 'hsl(30, 60%, 45%)', name: 'Marrom' },
  { color: 'hsl(271, 91%, 65%)', name: 'Violeta' },
];

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: TransactionType;
  accountType: AccountType;
  onCategoryAdded?: (categoryId: string) => void;
}

export function AddCategoryDialog({ 
  open, 
  onOpenChange, 
  type, 
  accountType,
  onCategoryAdded 
}: AddCategoryDialogProps) {
  const { addCategory, categories } = useFinance();
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('💰');
  const [selectedColor, setSelectedColor] = useState(categoryColors[0].color);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: 'Digite um nome para a categoria',
        variant: 'destructive',
      });
      return;
    }

    const exists = categories.some(
      c => c.name.toLowerCase() === name.trim().toLowerCase() && 
           c.type === type && 
           c.accountType === accountType
    );
    
    if (exists) {
      toast({
        title: 'Categoria já existe',
        description: 'Escolha outro nome para a categoria.',
        variant: 'destructive',
      });
      return;
    }

    const newCategoryId = addCategory({
      name: name.trim(),
      icon: selectedEmoji,
      color: selectedColor,
      type,
      accountType,
    });

    toast({
      title: 'Categoria criada!',
      description: `${selectedEmoji} ${name} foi adicionada com sucesso.`,
    });

    setName('');
    setSelectedEmoji('💰');
    setSelectedColor(categoryColors[0].color);
    setEmojiSearch('');
    setSelectedEmojiCategory(null);
    onOpenChange(false);

    if (onCategoryAdded) {
      onCategoryAdded(newCategoryId);
    }
  };

  // Filter emojis based on search or category
  const getFilteredEmojis = () => {
    if (emojiSearch) {
      const searchLower = emojiSearch.toLowerCase();
      const results: string[] = [];
      Object.entries(emojiCategories).forEach(([cat, emojis]) => {
        if (cat.toLowerCase().includes(searchLower)) {
          results.push(...emojis);
        }
      });
      if (results.length === 0) {
        // Return all emojis if no category matches
        return Object.values(emojiCategories).flat();
      }
      return results;
    }
    if (selectedEmojiCategory) {
      return emojiCategories[selectedEmojiCategory as keyof typeof emojiCategories] || [];
    }
    return Object.values(emojiCategories).flat();
  };

  const filteredEmojis = getFilteredEmojis();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Nova Categoria de {type === 'income' ? 'Receita' : 'Despesa'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Preview */}
          <div className="flex items-center justify-center">
            <div 
              className="flex items-center gap-3 px-6 py-4 rounded-2xl border-2 border-primary/20 transition-all"
              style={{ backgroundColor: `${selectedColor}15` }}
            >
              <span className="text-4xl">{selectedEmoji}</span>
              <span className="text-lg font-semibold">
                {name || 'Nome da categoria'}
              </span>
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Nome da Categoria
            </label>
            <Input
              placeholder="Ex: Assinaturas, Pets, Viagens..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12"
              maxLength={30}
            />
          </div>

          {/* Emoji Picker */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Escolha um Emoji
            </label>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categoria de emoji..."
                value={emojiSearch}
                onChange={(e) => {
                  setEmojiSearch(e.target.value);
                  setSelectedEmojiCategory(null);
                }}
                className="pl-10 h-10"
              />
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedEmojiCategory(null);
                  setEmojiSearch('');
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  !selectedEmojiCategory && !emojiSearch
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                )}
              >
                Todos
              </button>
              {Object.keys(emojiCategories).slice(0, 6).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedEmojiCategory(cat);
                    setEmojiSearch('');
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    selectedEmojiCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="grid grid-cols-8 gap-1.5 p-3 bg-secondary/50 rounded-xl max-h-36 overflow-y-auto">
              {filteredEmojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={cn(
                    "h-9 w-9 flex items-center justify-center text-xl rounded-lg transition-all hover:scale-110 hover:bg-background",
                    selectedEmoji === emoji
                      ? "bg-primary/20 ring-2 ring-primary scale-110"
                      : ""
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Escolha uma Cor
            </label>
            <div className="grid grid-cols-6 gap-3">
              {categoryColors.map((item) => (
                <button
                  key={item.color}
                  type="button"
                  onClick={() => setSelectedColor(item.color)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all hover:bg-secondary/50",
                    selectedColor === item.color && "bg-secondary"
                  )}
                >
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full transition-all",
                      selectedColor === item.color && "ring-2 ring-offset-2 ring-foreground scale-110"
                    )}
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] text-muted-foreground">{item.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            className="w-full h-12"
            onClick={handleSubmit}
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar Categoria
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
