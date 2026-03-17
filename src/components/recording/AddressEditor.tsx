'use client';

import { useState, useCallback } from 'react';
import { MapPin, Pencil, Search, X } from 'lucide-react';

interface NearbyAddress {
  display: string;
  full: string;
}

interface AddressEditorProps {
  currentAddress: string | null;
  position: { latitude: number; longitude: number } | null;
  isFetching: boolean;
  onUpdateAddress: () => void;
  onSetAddress: (address: string) => void;
}

export default function AddressEditor({
  currentAddress,
  position,
  isFetching,
  onUpdateAddress,
  onSetAddress,
}: AddressEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [nearbyAddresses, setNearbyAddresses] = useState<NearbyAddress[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchNearby = useCallback(async () => {
    if (!position) return;
    setIsSearching(true);
    try {
      // Search nearby addresses using Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=*&viewbox=${
          position.longitude - 0.001
        },${position.latitude + 0.001},${
          position.longitude + 0.001
        },${position.latitude - 0.001}&bounded=1&addressdetails=1&limit=8`,
        {
          headers: {
            'User-Agent': 'CanvassingCompanion/1.0 (contact@cf.design)',
          },
        }
      );
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();

      const addresses: NearbyAddress[] = data
        .filter((item: { address?: { house_number?: string; road?: string } }) => item.address?.house_number && item.address?.road)
        .map((item: { address: { house_number: string; road: string }; display_name: string }) => ({
          display: `${item.address.house_number} ${item.address.road}`,
          full: item.display_name,
        }))
        // Deduplicate by display
        .filter((addr: NearbyAddress, i: number, arr: NearbyAddress[]) =>
          arr.findIndex((a: NearbyAddress) => a.display === addr.display) === i
        );

      setNearbyAddresses(addresses);
    } catch {
      setNearbyAddresses([]);
    } finally {
      setIsSearching(false);
    }
  }, [position]);

  const handleManualSubmit = useCallback(() => {
    if (manualAddress.trim()) {
      onSetAddress(manualAddress.trim());
      setManualAddress('');
      setIsEditing(false);
    }
  }, [manualAddress, onSetAddress]);

  const handleSelectNearby = useCallback((address: string) => {
    onSetAddress(address);
    setIsEditing(false);
    setNearbyAddresses([]);
  }, [onSetAddress]);

  if (isEditing) {
    return (
      <div className="rounded-xl bg-black/70 backdrop-blur-md p-4 w-full max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white text-sm font-medium">Edit Address</p>
          <button
            onClick={() => { setIsEditing(false); setNearbyAddresses([]); }}
            className="text-white/60 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Manual input */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={manualAddress}
            onChange={(e) => setManualAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            placeholder="Type address..."
            className="flex-1 bg-white/10 text-white text-sm rounded-lg px-3 py-2 placeholder-white/30 outline-none focus:ring-1 focus:ring-white/30"
            autoFocus
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualAddress.trim()}
            className="bg-white/20 text-white text-sm px-3 py-2 rounded-lg hover:bg-white/30 disabled:opacity-30"
          >
            Set
          </button>
        </div>

        {/* Search nearby */}
        <button
          onClick={handleSearchNearby}
          disabled={!position || isSearching}
          className="w-full flex items-center justify-center gap-2 bg-white/10 text-white text-sm px-3 py-2 rounded-lg hover:bg-white/20 disabled:opacity-30 mb-2"
        >
          <Search className="w-4 h-4" />
          {isSearching ? 'Searching...' : 'Search Nearby Addresses'}
        </button>

        {/* Nearby results */}
        {nearbyAddresses.length > 0 && (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {nearbyAddresses.map((addr, i) => (
              <button
                key={i}
                onClick={() => handleSelectNearby(addr.display)}
                className="w-full text-left text-sm text-white bg-white/5 hover:bg-white/15 rounded-lg px-3 py-2 transition-colors"
              >
                {addr.display}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="rounded-lg bg-black/50 backdrop-blur-sm px-4 py-2 min-w-[200px] text-center">
        {currentAddress ? (
          <p className="text-white text-sm font-medium">{currentAddress}</p>
        ) : (
          <p className="text-white/40 text-sm">No address yet</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onUpdateAddress}
          disabled={!position || isFetching}
          className={`
            flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium min-h-[44px]
            transition-all active:scale-95
            ${!position || isFetching
              ? 'bg-white/10 text-white/30 cursor-not-allowed'
              : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
            }
          `}
        >
          <MapPin className="w-4 h-4" />
          {isFetching ? 'Finding...' : 'Update Address'}
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium min-h-[44px] bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all active:scale-95"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
