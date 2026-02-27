import React, { useState } from 'react';
import { Plus, Minus, Trash2, Camera, Package, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const ROOMS = [
  { id: 'living_room', label: 'Living Room', icon: '🛋️' },
  { id: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'bathroom', label: 'Bathroom', icon: '🚿' },
  { id: 'dining_room', label: 'Dining Room', icon: '🪑' },
  { id: 'office', label: 'Office', icon: '💻' },
  { id: 'garage', label: 'Garage', icon: '🚗' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌳' },
  { id: 'other', label: 'Other', icon: '📦' },
];

const COMMON_ITEMS = {
  living_room: [
    { name: 'Sofa (3-seater)', volume: 2.5, weight: 85 },
    { name: 'Sofa (2-seater)', volume: 1.8, weight: 65 },
    { name: 'Armchair', volume: 1.0, weight: 35 },
    { name: 'Coffee Table', volume: 0.5, weight: 25 },
    { name: 'TV Stand', volume: 0.8, weight: 30 },
    { name: 'Bookshelf', volume: 1.2, weight: 40 },
    { name: 'TV (50"+)', volume: 0.3, weight: 20, fragile: true },
    { name: 'Floor Lamp', volume: 0.2, weight: 5 },
  ],
  bedroom: [
    { name: 'Double Bed (with mattress)', volume: 3.0, weight: 80, dismantling: true },
    { name: 'King Bed (with mattress)', volume: 4.0, weight: 100, dismantling: true },
    { name: 'Single Bed (with mattress)', volume: 2.0, weight: 50 },
    { name: 'Wardrobe (large)', volume: 3.5, weight: 120, dismantling: true },
    { name: 'Wardrobe (small)', volume: 2.0, weight: 70 },
    { name: 'Chest of Drawers', volume: 1.0, weight: 45 },
    { name: 'Bedside Table', volume: 0.3, weight: 15 },
    { name: 'Dressing Table', volume: 1.2, weight: 50 },
  ],
  kitchen: [
    { name: 'Fridge (large)', volume: 1.5, weight: 120, heavy: true },
    { name: 'Fridge (small)', volume: 0.8, weight: 60 },
    { name: 'Washing Machine', volume: 0.8, weight: 75, heavy: true },
    { name: 'Dishwasher', volume: 0.7, weight: 50 },
    { name: 'Microwave', volume: 0.1, weight: 15 },
    { name: 'Kitchen Table', volume: 1.0, weight: 40 },
    { name: 'Kitchen Chair', volume: 0.2, weight: 8 },
    { name: 'Boxes (kitchenware)', volume: 0.5, weight: 15, fragile: true },
  ],
  bathroom: [
    { name: 'Bathroom Cabinet', volume: 0.5, weight: 20 },
    { name: 'Boxes (toiletries)', volume: 0.2, weight: 8 },
  ],
  dining_room: [
    { name: 'Dining Table (8-seater)', volume: 2.5, weight: 25 },
    { name: 'Dining Table (6-seater)', volume: 2.0, weight: 80 },
    { name: 'Dining Table (4-seater)', volume: 1.5, weight: 55 },
    { name: 'Dining Chair', volume: 0.3, weight: 12 },
    { name: 'Sideboard', volume: 1.5, weight: 65 },
    { name: 'Display Cabinet', volume: 2.0, weight: 70, fragile: true },
  ],
  office: [
    { name: 'Office Desk', volume: 1.5, weight: 60 },
    { name: 'Office Chair', volume: 0.5, weight: 15 },
    { name: 'Filing Cabinet', volume: 0.5, weight: 40 },
    { name: 'Bookshelf', volume: 1.2, weight: 45 },
    { name: 'Computer', volume: 0.2, weight: 10, fragile: true },
    { name: 'Printer', volume: 0.2, weight: 8 },
  ],
  garage: [
    { name: 'Tool Cabinet', volume: 1.0, weight: 50 },
    { name: 'Bicycle', volume: 0.5, weight: 15 },
    { name: 'Garden Tools', volume: 0.3, weight: 10 },
    { name: 'Large Equipment', volume: 2.0, weight: 150, heavy: true },
  ],
  outdoor: [
    { name: 'Patio Table', volume: 1.0, weight: 35 },
    { name: 'Patio Chair', volume: 0.3, weight: 10 },
    { name: 'BBQ', volume: 1.0, weight: 45 },
    { name: 'Potted Plant (large)', volume: 0.5, weight: 25 },
    { name: 'Potted Plant (small)', volume: 0.2, weight: 8 },
  ],
  other: [
    { name: 'Moving Box (large)', volume: 0.1, weight: 20 },
    { name: 'Moving Box (medium)', volume: 0.07, weight: 15 },
    { name: 'Moving Box (small)', volume: 0.04, weight: 10 },
    { name: 'Artwork/Mirror (large)', volume: 0.3, weight: 15, fragile: true },
    { name: 'Exercise Equipment', volume: 1.5, weight: 100, heavy: true },
    { name: 'Piano', volume: 3.0, weight: 300, heavy: true, oversized: true },
  ],
};

export default function InventoryWizard({ items, onChange, onNext, onBack }) {
  const [activeRoom, setActiveRoom] = useState('living_room');
  const [customItemName, setCustomItemName] = useState('');
  const [uploading, setUploading] = useState(false);

  const addItem = (item, room) => {
    const newItem = {
      id: Date.now().toString(),
      room,
      item_name: item.name,
      quantity: 1,
      is_fragile: item.fragile || false,
      is_valuable: false,
      needs_dismantling: item.dismantling || false,
      is_oversized: item.oversized || item.heavy || false,
      estimated_volume_m3: item.volume || 0.5,
      estimated_weight_kg: item.weight || 25,
      photo_urls: [],
      notes: '',
    };
    onChange([...items, newItem]);
  };

  const updateItem = (itemId, updates) => {
    onChange(items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    ));
  };

  const removeItem = (itemId) => {
    onChange(items.filter(item => item.id !== itemId));
  };

  const incrementQuantity = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      updateItem(itemId, { quantity: item.quantity + 1 });
    }
  };

  const decrementQuantity = (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (item && item.quantity > 1) {
      updateItem(itemId, { quantity: item.quantity - 1 });
    }
  };

  const handlePhotoUpload = async (itemId, file) => {
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const item = items.find(i => i.id === itemId);
      if (item) {
        updateItem(itemId, { 
          photo_urls: [...(item.photo_urls || []), file_url] 
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const addCustomItem = () => {
    if (customItemName.trim()) {
      addItem({ name: customItemName.trim(), volume: 0.5, weight: 25 }, activeRoom);
      setCustomItemName('');
    }
  };

  const roomItems = items.filter(item => item.room === activeRoom);
  const totalVolume = items.reduce((sum, item) => 
    sum + (item.estimated_volume_m3 || 0.5) * item.quantity, 0
  );
  const totalWeight = items.reduce((sum, item) => 
    sum + (item.estimated_weight_kg || 25) * item.quantity, 0
  );
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Truck size recommendation based on volume and weight
  const getTruckRecommendation = () => {
    if (totalVolume <= 8 && totalWeight <= 1000) {
      return { size: '2-ton', capacity: '8m³', maxWeight: '1,000kg', suitable: true };
    } else if (totalVolume <= 14 && totalWeight <= 1500) {
      return { size: '4-ton', capacity: '14m³', maxWeight: '1,500kg', suitable: true };
    } else if (totalVolume <= 22 && totalWeight <= 2500) {
      return { size: '8-ton', capacity: '22m³', maxWeight: '2,500kg', suitable: true };
    } else {
      return { size: '10-ton+', capacity: '30m³+', maxWeight: '4,000kg+', suitable: totalVolume <= 30 && totalWeight <= 4000 };
    }
  };

  const truckRec = getTruckRecommendation();

  const getItemCountForRoom = (roomId) => {
    return items.filter(i => i.room === roomId).reduce((sum, i) => sum + i.quantity, 0);
  };

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <Card className="bg-black text-white">
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <div>
                <p className="text-sm text-gray-400">Total Items</p>
                <p className="text-2xl font-bold">{totalItems}</p>
              </div>
              <div className="w-px h-10 bg-gray-700" />
              <div>
                <p className="text-sm text-gray-400">Est. Volume</p>
                <p className="text-2xl font-bold">{totalVolume.toFixed(1)} m³</p>
              </div>
              <div className="w-px h-10 bg-gray-700" />
              <div>
                <p className="text-sm text-gray-400">Est. Weight</p>
                <p className="text-2xl font-bold">{totalWeight.toFixed(0)} kg</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Sparkles className="w-4 h-4" />
              Based on typical item sizes
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Truck Recommendation */}
      {items.length > 0 && (
        <Card className={cn(
          "border-2",
          truckRec.suitable ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"
        )}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Recommended Truck Size</p>
                <p className="text-2xl font-bold text-gray-900">{truckRec.size} Truck</p>
                <p className="text-sm text-gray-600 mt-1">
                  Capacity: {truckRec.capacity} • Max Load: {truckRec.maxWeight}
                </p>
              </div>
              {!truckRec.suitable && (
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">May require multiple trips</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room Tabs */}
      <Tabs value={activeRoom} onValueChange={setActiveRoom}>
        <TabsList className="w-full h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
          {ROOMS.map((room) => {
            const count = getItemCountForRoom(room.id);
            return (
              <TabsTrigger
                key={room.id}
                value={room.id}
                className={cn(
                  "px-4 py-2.5 rounded-xl border-2 data-[state=active]:border-black data-[state=active]:bg-gray-50",
                  "border-gray-200 hover:border-gray-300 transition-all"
                )}
              >
                <span className="mr-2">{room.icon}</span>
                {room.label}
                {count > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-black text-white">
                    {count}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {ROOMS.map((room) => (
          <TabsContent key={room.id} value={room.id} className="mt-6 space-y-6">
            {/* Quick Add Common Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Add</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {COMMON_ITEMS[room.id]?.map((item) => (
                    <Button
                      key={item.name}
                      variant="outline"
                      size="sm"
                      onClick={() => addItem(item, room.id)}
                      className="rounded-full"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      {item.name}
                    </Button>
                  ))}
                </div>

                {/* Custom Item */}
                <div className="flex gap-2 mt-4">
                  <Input
                    placeholder="Add custom item..."
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
                  />
                  <Button onClick={addCustomItem} disabled={!customItemName.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Added Items */}
            {roomItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Added Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {roomItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50 rounded-xl space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{item.item_name}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
                            <span>{((item.estimated_volume_m3 || 0.5) * item.quantity).toFixed(1)} m³</span>
                            <span>•</span>
                            <span>{((item.estimated_weight_kg || 25) * item.quantity).toFixed(0)} kg</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.is_fragile && (
                              <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Fragile
                              </Badge>
                            )}
                            {item.needs_dismantling && (
                              <Badge variant="outline">Needs Dismantling</Badge>
                            )}
                            {item.is_oversized && (
                              <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                Heavy/Oversized
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-white rounded-lg border">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => decrementQuantity(item.id)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => incrementQuantity(item.id)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Item Options */}
                      <div className="flex flex-wrap gap-4 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`fragile-${item.id}`}
                            checked={item.is_fragile}
                            onCheckedChange={(v) => updateItem(item.id, { is_fragile: v })}
                          />
                          <Label htmlFor={`fragile-${item.id}`} className="text-sm cursor-pointer">
                            Fragile
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`valuable-${item.id}`}
                            checked={item.is_valuable}
                            onCheckedChange={(v) => updateItem(item.id, { is_valuable: v })}
                          />
                          <Label htmlFor={`valuable-${item.id}`} className="text-sm cursor-pointer">
                            Valuable
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`dismantle-${item.id}`}
                            checked={item.needs_dismantling}
                            onCheckedChange={(v) => updateItem(item.id, { needs_dismantling: v })}
                          />
                          <Label htmlFor={`dismantle-${item.id}`} className="text-sm cursor-pointer">
                            Needs Dismantling
                          </Label>
                        </div>
                      </div>

                      {/* Photo Upload */}
                      <div className="flex items-center gap-2 pt-2">
                        <Label
                          htmlFor={`photo-${item.id}`}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <Camera className="w-4 h-4" />
                          Add Photo
                        </Label>
                        <input
                          id={`photo-${item.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handlePhotoUpload(item.id, e.target.files[0]);
                            }
                          }}
                        />
                        {item.photo_urls?.map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt="Item"
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button 
          onClick={onNext}
          disabled={items.length === 0}
          className="bg-black text-white hover:bg-gray-800"
        >
          Continue to Packaging
        </Button>
      </div>
    </div>
  );
}