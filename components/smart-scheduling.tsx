import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

interface TimeSlot {
  datetime: Date;
  confidence: number;
  reasoning: string;
}

interface SmartSchedulingProps {
  artisanId: string;
  customerId: string;
  onSelectTime: (datetime: Date) => void;
  selectedTime?: Date;
}

export function SmartScheduling({
  artisanId,
  customerId,
  onSelectTime,
  selectedTime,
}: SmartSchedulingProps) {
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<TimeSlot[]>([]);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    generateSuggestions();
  }, [artisanId]);

  async function generateSuggestions() {
    try {
      setLoading(true);

      // Fetch booking patterns for this artisan
      const { data: patterns } = await supabase
        .from('booking_patterns')
        .select('*')
        .eq('artisan_id', artisanId)
        .order('acceptance_rate', { ascending: false })
        .limit(20);

      if (!patterns || patterns.length === 0) {
        // No patterns yet, suggest default times
        setSuggestions(getDefaultSuggestions());
        setLoading(false);
        return;
      }

      // Generate suggestions based on patterns
      const now = new Date();
      const suggestedSlots: TimeSlot[] = [];

      // Get top 3 time slots based on acceptance rate
      const topPatterns = patterns.slice(0, 3);

      for (const pattern of topPatterns) {
        // Find next occurrence of this day/hour
        const nextSlot = getNextOccurrence(
          now,
          pattern.day_of_week,
          pattern.hour_of_day
        );

        suggestedSlots.push({
          datetime: nextSlot,
          confidence: pattern.acceptance_rate || 50,
          reasoning: generateReasoning(pattern),
        });
      }

      // Sort by datetime
      suggestedSlots.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());

      setSuggestions(suggestedSlots);

      // Log suggestions for analytics
      for (const slot of suggestedSlots) {
        await supabase.from('scheduling_suggestions').insert({
          artisan_id: artisanId,
          customer_id: customerId,
          suggested_datetime: slot.datetime.toISOString(),
          confidence_score: slot.confidence,
          reasoning: slot.reasoning,
          was_shown: true,
        });
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions(getDefaultSuggestions());
    } finally {
      setLoading(false);
    }
  }

  function getNextOccurrence(
    fromDate: Date,
    dayOfWeek: number,
    hourOfDay: number
  ): Date {
    const result = new Date(fromDate);
    result.setHours(hourOfDay, 0, 0, 0);

    // Find next occurrence of this day of week
    const currentDay = result.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;

    if (daysUntilTarget === 0 && result <= fromDate) {
      // If it's today but the time has passed, go to next week
      result.setDate(result.getDate() + 7);
    } else {
      result.setDate(result.getDate() + daysUntilTarget);
    }

    return result;
  }

  function generateReasoning(pattern: any): string {
    const acceptanceRate = pattern.acceptance_rate || 0;
    const bookingCount = pattern.booking_count || 0;

    if (acceptanceRate >= 80 && bookingCount >= 5) {
      return `Highly preferred time (${acceptanceRate.toFixed(0)}% acceptance rate)`;
    } else if (acceptanceRate >= 60) {
      return `Popular time slot (${acceptanceRate.toFixed(0)}% acceptance)`;
    } else if (bookingCount >= 10) {
      return `Frequently booked time`;
    } else {
      return `Available time slot`;
    }
  }

  function getDefaultSuggestions(): TimeSlot[] {
    const now = new Date();
    const suggestions: TimeSlot[] = [];

    // Suggest tomorrow at 10 AM
    const tomorrow10am = new Date(now);
    tomorrow10am.setDate(tomorrow10am.getDate() + 1);
    tomorrow10am.setHours(10, 0, 0, 0);
    suggestions.push({
      datetime: tomorrow10am,
      confidence: 70,
      reasoning: 'Morning hours are typically preferred',
    });

    // Suggest day after tomorrow at 2 PM
    const dayAfter2pm = new Date(now);
    dayAfter2pm.setDate(dayAfter2pm.getDate() + 2);
    dayAfter2pm.setHours(14, 0, 0, 0);
    suggestions.push({
      datetime: dayAfter2pm,
      confidence: 65,
      reasoning: 'Afternoon slots offer flexibility',
    });

    // Suggest in 3 days at 9 AM
    const threeDays9am = new Date(now);
    threeDays9am.setDate(threeDays9am.getDate() + 3);
    threeDays9am.setHours(9, 0, 0, 0);
    suggestions.push({
      datetime: threeDays9am,
      confidence: 60,
      reasoning: 'Early start for your project',
    });

    return suggestions;
  }

  function formatDateTime(date: Date): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const dayNum = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');

    return `${dayName}, ${monthName} ${dayNum} at ${displayHours}:${displayMinutes} ${ampm}`;
  }

  function getConfidenceColor(confidence: number): string {
    if (confidence >= 80) return 'bg-success/20 border-success';
    if (confidence >= 60) return 'bg-primary/20 border-primary';
    return 'bg-warning/20 border-warning';
  }

  function getConfidenceTextColor(confidence: number): string {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-primary';
    return 'text-warning';
  }

  if (loading) {
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#0a7ea4" />
        <Text className="text-muted text-center mt-2 text-sm">
          Finding best times...
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-foreground font-semibold text-base">
          ⚡ Recommended Times
        </Text>
        <TouchableOpacity onPress={() => setShowManual(!showManual)}>
          <Text className="text-primary text-sm">
            {showManual ? 'Hide' : 'Pick manually'}
          </Text>
        </TouchableOpacity>
      </View>

      {!showManual && (
        <View className="space-y-3">
          {suggestions.map((slot, index) => {
            const isSelected =
              selectedTime?.getTime() === slot.datetime.getTime();

            return (
              <TouchableOpacity
                key={index}
                onPress={() => onSelectTime(slot.datetime)}
                className={`rounded-xl p-4 border-2 ${
                  isSelected
                    ? 'bg-primary/20 border-primary'
                    : `${getConfidenceColor(slot.confidence)} border-border`
                }`}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold text-base">
                      {formatDateTime(slot.datetime)}
                    </Text>
                    <Text className="text-muted text-xs mt-1">
                      {slot.reasoning}
                    </Text>
                  </View>
                  <View
                    className={`px-2 py-1 rounded-full ${
                      isSelected ? 'bg-primary' : getConfidenceColor(slot.confidence)
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-white' : getConfidenceTextColor(slot.confidence)
                      }`}
                    >
                      {slot.confidence.toFixed(0)}%
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <View className="pt-2 border-t border-primary/30">
                    <Text className="text-primary text-xs font-semibold">
                      ✓ Selected
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {!showManual && (
        <View className="mt-3 bg-surface rounded-lg p-3">
          <Text className="text-muted text-xs text-center">
            Times suggested based on artisan's availability patterns
          </Text>
        </View>
      )}
    </View>
  );
}
