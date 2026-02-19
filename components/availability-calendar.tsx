import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

type TimeSlot = {
  time: string;
  available: boolean;
};

type AvailabilityCalendarProps = {
  artisanId: string;
  onSelectSlot: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
};

const DAYS_TO_SHOW = 14; // Show next 2 weeks

export function AvailabilityCalendar({
  artisanId,
  onSelectSlot,
  selectedDate,
  selectedTime,
}: AvailabilityCalendarProps) {
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDateObj, setSelectedDateObj] = useState<Date | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate next 14 days
  useEffect(() => {
    const today = new Date();
    const nextDays: Date[] = [];
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      nextDays.push(date);
    }
    setDates(nextDays);
    setSelectedDateObj(nextDays[0]);
  }, []);

  // Fetch available time slots for selected date
  useEffect(() => {
    if (!selectedDateObj) return;

    async function fetchTimeSlots() {
      if (!selectedDateObj) return;
      
      try {
        setLoading(true);
        const dayOfWeek = selectedDateObj.getDay();
        const dateStr = selectedDateObj.toISOString().split('T')[0];

        // Check if date is blocked
        const { data: blockedData } = await supabase
          .from('blocked_dates')
          .select('*')
          .eq('artisan_id', artisanId)
          .eq('blocked_date', dateStr)
          .single();

        if (blockedData) {
          setTimeSlots([]);
          return;
        }

        // Get availability slots for this day
        const { data: slots, error } = await supabase
          .from('availability_slots')
          .select('start_time, end_time')
          .eq('artisan_id', artisanId)
          .eq('day_of_week', dayOfWeek)
          .eq('is_available', true)
          .order('start_time');

        if (error) throw error;

        if (!slots || slots.length === 0) {
          setTimeSlots([]);
          return;
        }

        // Get existing bookings for this date
        const { data: bookings } = await supabase
          .from('bookings')
          .select('preferred_date')
          .eq('artisan_id', artisanId)
          .gte('preferred_date', `${dateStr} 00:00:00`)
          .lte('preferred_date', `${dateStr} 23:59:59`)
          .in('status', ['pending', 'accepted', 'in_progress']);

        const bookedHours = new Set(
          bookings?.map((b) => {
            const hour = new Date(b.preferred_date).getHours();
            return hour;
          }) || []
        );

        // Generate time slots
        const allSlots: TimeSlot[] = [];
        slots.forEach((slot) => {
          const startHour = parseInt(slot.start_time.split(':')[0]);
          const endHour = parseInt(slot.end_time.split(':')[0]);

          for (let hour = startHour; hour < endHour; hour++) {
            const timeStr = `${hour.toString().padStart(2, '0')}:00`;
            allSlots.push({
              time: timeStr,
              available: !bookedHours.has(hour),
            });
          }
        });

        setTimeSlots(allSlots);
      } catch (err) {
        console.error('Error fetching time slots:', err);
        setTimeSlots([]);
      } finally {
        setLoading(false);
      }
    }

    fetchTimeSlots();
  }, [selectedDateObj, artisanId]);

  const formatDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: date.getMonth() + 1,
    };
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatTimeDisplay = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  return (
    <View>
      {/* Date Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
        <View className="flex-row gap-2">
          {dates.map((date, index) => {
            const { day, date: dateNum } = formatDate(date);
            const isSelected =
              selectedDateObj?.toDateString() === date.toDateString();
            const isTodayDate = isToday(date);

            return (
              <TouchableOpacity
                key={index}
                onPress={() => setSelectedDateObj(date)}
                className={`items-center justify-center px-4 py-3 rounded-xl border-2 min-w-[70px] ${
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'bg-surface border-border'
                }`}
              >
                <Text
                  className={`text-xs font-medium mb-1 ${
                    isSelected ? 'text-background' : 'text-muted'
                  }`}
                >
                  {day}
                </Text>
                <Text
                  className={`text-lg font-bold ${
                    isSelected ? 'text-background' : 'text-foreground'
                  }`}
                >
                  {dateNum}
                </Text>
                {isTodayDate && !isSelected && (
                  <View className="w-1 h-1 rounded-full bg-primary mt-1" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Time Slots */}
      <View>
        <Text className="text-sm font-semibold text-foreground mb-3">
          Available Time Slots
        </Text>
        {loading ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator size="small" color="#0a7ea4" />
            <Text className="text-muted text-xs mt-2">Loading slots...</Text>
          </View>
        ) : timeSlots.length === 0 ? (
          <View className="items-center justify-center py-8 bg-surface rounded-xl">
            <Text className="text-muted text-sm">No available slots for this date</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {timeSlots.map((slot, index) => {
              const dateStr = selectedDateObj?.toISOString().split('T')[0];
              const isSelected = selectedDate === dateStr && selectedTime === slot.time;

              return (
                <TouchableOpacity
                  key={index}
                  disabled={!slot.available}
                  onPress={() => {
                    if (slot.available && selectedDateObj) {
                      const dateStr = selectedDateObj.toISOString().split('T')[0];
                      onSelectSlot(dateStr, slot.time);
                    }
                  }}
                  className={`px-4 py-3 rounded-lg border ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : slot.available
                      ? 'bg-surface border-border'
                      : 'bg-muted/20 border-muted/30'
                  }`}
                  style={{ opacity: slot.available ? 1 : 0.4 }}
                >
                  <Text
                    className={`text-sm font-medium ${
                      isSelected
                        ? 'text-background'
                        : slot.available
                        ? 'text-foreground'
                        : 'text-muted'
                    }`}
                  >
                    {formatTimeDisplay(slot.time)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}
