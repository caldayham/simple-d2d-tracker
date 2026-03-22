'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Visit, ResultTag, Session } from '@/lib/types';
import type { AddressSuggestion } from '@/lib/geocoding';
import { searchAddress } from '@/lib/geocoding';

interface EditVisitModalProps {
  visit: Visit | null; // null = adding new
  sessions: Session[];
  visits: Visit[];
  resultTags: ResultTag[];
  onSave: (data: {
    id?: string;
    session_id: string;
    address: string;
    latitude: string;
    longitude: string;
    result: string;
    notes: string;
    contact_name: string;
    gender: string;
    age_range: string;
    occupancy: string;
  }) => void;
  onClose: () => void;
  isSaving: boolean;
  defaultSessionId?: string | null;
}

export function EditVisitModal({
  visit,
  sessions,
  visits: allVisits,
  resultTags,
  onSave,
  onClose,
  isSaving,
  defaultSessionId,
}: EditVisitModalProps) {
  const isEditing = !!visit;

  const [sessionId, setSessionId] = useState(
    visit?.session_id ?? defaultSessionId ?? sessions[sessions.length - 1]?.id ?? ''
  );
  const [address, setAddress] = useState(visit?.address ?? '');
  const [latitude, setLatitude] = useState(
    visit?.latitude?.toString() ?? ''
  );
  const [longitude, setLongitude] = useState(
    visit?.longitude?.toString() ?? ''
  );
  const [result, setResult] = useState(visit?.result ?? '');
  const [notes, setNotes] = useState(visit?.notes ?? '');
  const [contactName, setContactName] = useState(visit?.contact_name ?? '');
  const [gender, setGender] = useState(visit?.gender ?? '');
  const [ageRange, setAgeRange] = useState(visit?.age_range ?? '');
  const [occupancy, setOccupancy] = useState(visit?.occupancy ?? '');

  // Compute average center from all visits for search bias
  const searchCenter = useMemo(() => {
    if (allVisits.length === 0) return { lat: undefined, lon: undefined };
    const sumLat = allVisits.reduce((s, v) => s + v.latitude, 0);
    const sumLon = allVisits.reduce((s, v) => s + v.longitude, 0);
    return {
      lat: sumLat / allVisits.length,
      lon: sumLon / allVisits.length,
    };
  }, [allVisits]);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Close modal on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        addressInputRef.current &&
        !addressInputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleAddressChange = useCallback((value: string) => {
    setAddress(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchAddress(value, searchCenter.lat, searchCenter.lon);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    }, 350);
  }, [searchCenter]);

  function selectSuggestion(s: AddressSuggestion) {
    setAddress(s.short_address);
    setLatitude(s.lat.toString());
    setLongitude(s.lon.toString());
    setSuggestions([]);
    setShowSuggestions(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      id: visit?.id,
      session_id: sessionId,
      address,
      latitude,
      longitude,
      result,
      notes,
      contact_name: contactName,
      gender,
      age_range: ageRange,
      occupancy,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-white font-medium">
            {isEditing ? 'Edit Visit' : 'Add Visit'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Session picker (only for new visits) */}
          {!isEditing && (
            <label className="block">
              <span className="text-zinc-400 text-xs mb-1 block">
                Session
              </span>
              <select
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label || new Date(s.started_at).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* Address with autocomplete */}
          <div className="relative">
            <span className="text-zinc-400 text-xs mb-1 block">Address</span>
            <div className="relative">
              <input
                ref={addressInputRef}
                type="text"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Start typing an address..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-8"
              />
              {isSearching && (
                <Loader2
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 animate-spin"
                />
              )}
            </div>
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute left-0 right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden shadow-xl max-h-48 overflow-y-auto"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className="w-full text-left px-3 py-2.5 hover:bg-zinc-700 transition-colors border-b border-zinc-700/50 last:border-0"
                  >
                    <span className="text-white text-sm block">
                      {s.short_address}
                    </span>
                    <span className="text-zinc-400 text-xs block truncate">
                      {s.display_name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coordinates (read-only display, auto-filled from address) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-zinc-400 text-xs">Coordinates</span>
              <button
                type="button"
                disabled={!address || address.length < 3 || isSearching}
                onClick={async () => {
                  setIsSearching(true);
                  const results = await searchAddress(address, searchCenter.lat, searchCenter.lon);
                  setIsSearching(false);
                  if (results.length > 0) {
                    setLatitude(results[0].lat.toString());
                    setLongitude(results[0].lon.toString());
                  } else {
                    alert('Could not find coordinates for this address');
                  }
                }}
                className="text-blue-400 text-xs hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Looking up...' : 'Update coordinates from address'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                placeholder="Latitude"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
                placeholder="Longitude"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {latitude && longitude && (
              <p className="text-zinc-500 text-xs mt-1">
                {parseFloat(latitude).toFixed(5)}, {parseFloat(longitude).toFixed(5)}
              </p>
            )}
          </div>

          {/* Result */}
          <div>
            <span className="text-zinc-400 text-xs mb-1 block">Result</span>
            <div className="flex flex-wrap gap-2">
              {resultTags.map((tag) => (
                <button
                  key={tag.name}
                  type="button"
                  onClick={() =>
                    setResult(result === tag.name ? '' : tag.name)
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    result === tag.name
                      ? 'text-white ring-2 ring-white/30'
                      : 'text-white/70 hover:text-white'
                  }`}
                  style={{
                    backgroundColor:
                      result === tag.name ? tag.color : `${tag.color}40`,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {/* Contact Name */}
          <label className="block">
            <span className="text-zinc-400 text-xs mb-1 block">Name</span>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact name (optional)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>

          {/* Gender */}
          <div>
            <span className="text-zinc-400 text-xs mb-1 block">Gender</span>
            <div className="flex gap-2">
              {(['Male', 'Female', 'Unknown'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(gender === g ? '' : g)}
                  className={`flex-1 py-1.5 px-3 text-xs rounded-full font-medium transition-all ${
                    gender === g
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Age Range */}
          <div>
            <span className="text-zinc-400 text-xs mb-1 block">Age Range</span>
            <div className="flex gap-2">
              {(['<30', '30-50', '50-70', '>70'] as const).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAgeRange(ageRange === a ? '' : a)}
                  className={`flex-1 py-1.5 px-3 text-xs rounded-full font-medium transition-all ${
                    ageRange === a
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Occupancy */}
          <div>
            <span className="text-zinc-400 text-xs mb-1 block">Occupancy</span>
            <div className="flex gap-2">
              {(['Homeowner', 'Renter', 'Unknown'] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOccupancy(occupancy === o ? '' : o)}
                  className={`flex-1 py-1.5 px-3 text-xs rounded-full font-medium transition-all ${
                    occupancy === o
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <label className="block">
            <span className="text-zinc-400 text-xs mb-1 block">Notes</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes..."
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </label>
        </div>

        <div className="p-4 border-t border-zinc-800 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving || !latitude || !longitude}
            className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving
              ? 'Saving...'
              : isEditing
                ? 'Save Changes'
                : 'Add Visit'}
          </button>
        </div>
      </form>
    </div>
  );
}
