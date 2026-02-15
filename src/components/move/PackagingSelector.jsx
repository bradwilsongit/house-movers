import React, { useState, useEffect } from 'react';
import { Plus, Minus, Package, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const DEFAULT_PACKAGING = [
  { id: '1', name: 'Large Box', description: '60x40x40cm - Ideal for bedding, clothes', category: 'boxes', unit_price: 45 },
  { id: '2', name: 'Medium Box', description: '40x30x30cm - Books, kitchen items', category: 'boxes', unit_price: 35 },
  { id: '3', name: 'Small Box', description: '30x20x20cm - Fragile items', category: 'boxes', unit_price: 25 },
  { id: '4', name: 'Wardrobe Box', description: 'Hanging clothes box', category: 'boxes', unit_price: 120 },
  { id: '5', name: 'Bubble Wrap (10m)', description: 'Protection for fragile items', category: 'wrapping', unit_price: 85 },
  { id: '6', name: 'Packing Paper (5kg)', description: 'For wrapping items', category: 'wrapping', unit_price: 65 },
  { id: '7', name: 'Packing Tape', description: 'Heavy duty tape roll', category: 'tape', unit_price: 35 },
  { id: '8', name: 'Moving Blanket', description: 'Furniture protection', category: 'blankets', unit_price: 80 },
  { id: '9', name: 'Mattress Cover', description: 'Single/Double size', category: 'specialty', unit_price: 95 },
  { id: '10', name: 'TV Box', description: 'For 50"+ screens', category: 'specialty', unit_price: 150 },
];

export default function PackagingSelector({ 
  packagingOrder, 
  onChange, 
  inventoryItems,
  onNext, 
  onBack 
}) {
  const [packagingItems, setPackagingItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(packagingOrder?.items || []);
  const [includePackingService, setIncludePackingService] = useState(
    packagingOrder?.include_packing_service || false
  );

  useEffect(() => {
    loadPackagingItems();
  }, []);

  // Removed auto-suggestion - customers select manually

  const loadPackagingItems = async () => {
    try {
      const items = await base44.entities.PackagingItem.filter({ is_active: true });
      setPackagingItems(items.length > 0 ? items : DEFAULT_PACKAGING);
    } catch (e) {
      setPackagingItems(DEFAULT_PACKAGING);
    }
  };

  const suggestPackaging = () => {
    const totalItems = inventoryItems.reduce((sum, i) => sum + i.quantity, 0);
    const hasFragile = inventoryItems.some(i => i.is_fragile);
    const hasBeds = inventoryItems.some(i => 
      i.item_name.toLowerCase().includes('bed')
    );
    const hasWardrobe = inventoryItems.some(i => 
      i.item_name.toLowerCase().includes('wardrobe')
    );
    const hasTV = inventoryItems.some(i => 
      i.item_name.toLowerCase().includes('tv')
    );

    const suggestions = [];
    
    // Suggest boxes
    suggestions.push({
      packaging_item_id: '1',
      name: 'Large Box',
      quantity: Math.ceil(totalItems / 3),
      unit_price: 45,
      total_price: Math.ceil(totalItems / 3) * 45
    });
    suggestions.push({
      packaging_item_id: '2',
      name: 'Medium Box',
      quantity: Math.ceil(totalItems / 2),
      unit_price: 35,
      total_price: Math.ceil(totalItems / 2) * 35
    });

    if (hasFragile) {
      suggestions.push({
        packaging_item_id: '5',
        name: 'Bubble Wrap (10m)',
        quantity: 2,
        unit_price: 85,
        total_price: 170
      });
    }

    if (hasBeds) {
      suggestions.push({
        packaging_item_id: '9',
        name: 'Mattress Cover',
        quantity: inventoryItems.filter(i => i.item_name.toLowerCase().includes('bed')).reduce((s, i) => s + i.quantity, 0),
        unit_price: 95,
        total_price: 95
      });
    }

    if (hasWardrobe) {
      suggestions.push({
        packaging_item_id: '4',
        name: 'Wardrobe Box',
        quantity: 2,
        unit_price: 120,
        total_price: 240
      });
    }

    if (hasTV) {
      suggestions.push({
        packaging_item_id: '10',
        name: 'TV Box',
        quantity: 1,
        unit_price: 150,
        total_price: 150
      });
    }

    // Tape
    suggestions.push({
      packaging_item_id: '7',
      name: 'Packing Tape',
      quantity: 2,
      unit_price: 35,
      total_price: 70
    });

    setSelectedItems(suggestions);
  };

  const updateQuantity = (itemId, delta) => {
    const existing = selectedItems.find(i => i.packaging_item_id === itemId);
    const packagingItem = packagingItems.find(p => p.id === itemId);
    
    if (existing) {
      const newQty = Math.max(0, existing.quantity + delta);
      if (newQty === 0) {
        setSelectedItems(selectedItems.filter(i => i.packaging_item_id !== itemId));
      } else {
        setSelectedItems(selectedItems.map(i => 
          i.packaging_item_id === itemId 
            ? { ...i, quantity: newQty, total_price: newQty * i.unit_price }
            : i
        ));
      }
    } else if (delta > 0 && packagingItem) {
      setSelectedItems([...selectedItems, {
        packaging_item_id: itemId,
        name: packagingItem.name,
        quantity: 1,
        unit_price: packagingItem.unit_price,
        total_price: packagingItem.unit_price
      }]);
    }
  };

  const getQuantity = (itemId) => {
    return selectedItems.find(i => i.packaging_item_id === itemId)?.quantity || 0;
  };

  const totalAmount = selectedItems
    .filter(i => i.quantity > 0)
    .reduce((sum, i) => sum + i.total_price, 0) + 
    (includePackingService ? 800 : 0);
  
  const selectedCount = selectedItems.filter(i => i.quantity > 0).length;

  const handleNext = () => {
    onChange({
      items: selectedItems.filter(i => i.quantity > 0),
      include_packing_service: includePackingService,
      packing_service_price: includePackingService ? 800 : 0,
      total_amount: totalAmount
    });
    onNext();
  };

  const categories = [
    { id: 'boxes', label: 'Boxes', icon: '📦' },
    { id: 'wrapping', label: 'Wrapping', icon: '🎁' },
    { id: 'tape', label: 'Tape & Supplies', icon: '🔧' },
    { id: 'blankets', label: 'Blankets', icon: '🛡️' },
    { id: 'specialty', label: 'Specialty', icon: '⭐' },
  ];

  return (
    <div className="space-y-6">


      {/* Packaging Categories */}
      {categories.map((category) => {
        const categoryItems = packagingItems.filter(p => p.category === category.id);
        if (categoryItems.length === 0) return null;

        return (
          <Card key={category.id}>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span>{category.icon}</span>
                {category.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryItems.map((item) => {
                const qty = getQuantity(item.id);
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl transition-all",
                      qty > 0 ? "bg-gray-50 border-2 border-black" : "bg-gray-50 border-2 border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {qty > 0 && (
                        <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">R{item.unit_price}</span>
                      <div className="flex items-center bg-white rounded-lg border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{qty}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}

      {/* Packing Service */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-medium">Professional Packing Service</p>
                <p className="text-sm text-gray-500">
                  Our team will pack all your items on moving day
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-medium">R800</span>
              <Switch
                checked={includePackingService}
                onCheckedChange={setIncludePackingService}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total */}
      <Card className="bg-black text-white">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Packaging Total</p>
              <p className="text-3xl font-bold">R{totalAmount.toLocaleString()}</p>
            </div>
            <div className="text-right text-sm text-gray-400">
              <p>{selectedCount} items selected</p>
              {includePackingService && <p>+ Packing service</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={handleNext}
          className="bg-black text-white hover:bg-gray-800"
        >
          Continue to Quotes
        </Button>
      </div>
    </div>
  );
}