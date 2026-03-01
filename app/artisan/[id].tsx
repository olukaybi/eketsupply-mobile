import { useState, useEffect } from "react";
import { ScrollView, Text, View, TouchableOpacity, Image, FlatList, Modal, ActivityIndicator, TextInput, Alert, Platform, Share } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { PhotoGalleryViewer } from "@/components/photo-gallery-viewer";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { BeforeAfterViewer } from "@/components/before-after-viewer";
import { ArtisanBadges, type BadgeType } from "@/components/artisan-badges";
import { VideoTestimonialPlayer } from "@/components/video-testimonial-player";
import { VerifiedBadge } from "@/components/verified-badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import * as Haptics from "expo-haptics";

type Review = {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  photos?: string[] | null;
};

type Service = {
  id: string;
  name: string;
  price: string;
  duration: string;
};

type ArtisanProfile = {
  id: string;
  name: string;
  service: string;
  rating: number;
  reviews: number;
  location: string;
  verified: boolean;
  bio: string;
  completedJobs: number;
  responseTime: string;
  availability: string;
};

type BeforeAfterProject = {
  id: string;
  project_title: string;
  project_description: string | null;
  before_photo_url: string;
  after_photo_url: string;
};

type VideoTestimonial = {
  id: string;
  customer_name: string;
  rating: number;
  video_url: string;
  duration_seconds: number;
};

type ServicePackage = {
  id: string;
  package_name: string;
  description: string | null;
  original_price: number;
  discounted_price: number;
  discount_percentage: number;
  services: Service[];
};

export default function ArtisanProfileScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { sendLocalNotification } = useNotifications();
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [artisan, setArtisan] = useState<ArtisanProfile | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [portfolioPhotos, setPortfolioPhotos] = useState<string[]>([]);
  const [beforeAfterProjects, setBeforeAfterProjects] = useState<BeforeAfterProject[]>([]);
  const [beforeAfterViewerVisible, setBeforeAfterViewerVisible] = useState(false);
  const [beforeAfterInitialIndex, setBeforeAfterInitialIndex] = useState(0);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [videoTestimonials, setVideoTestimonials] = useState<VideoTestimonial[]>([]);
  const [servicePackages, setServicePackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Quote form state
  const [quoteForm, setQuoteForm] = useState({
    serviceDescription: '',
    location: '',
    preferredDate: '',
    notes: '',
  });

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    selectedService: '',
    serviceDescription: '',
    preferredDate: '',
    preferredTime: '',
    location: '',
    paymentMethod: 'cash',
    notes: '',
  });

  // Fetch artisan data from Supabase
  useEffect(() => {
    async function fetchArtisanData() {
      try {
        setLoading(true);
        
        // Fetch artisan profile
        const { data: artisanData, error: artisanError } = await supabase
          .from('artisans')
          .select(`
            *,
            profiles!artisans_profile_id_fkey(full_name, email)
          `)
          .eq('id', id)
          .single();

        if (artisanError) {
          console.error('Error fetching artisan:', artisanError);
          return;
        }

        if (artisanData) {
          setArtisan({
            id: artisanData.id,
            name: artisanData.profiles.full_name,
            service: artisanData.service_category,
            rating: artisanData.rating,
            reviews: artisanData.total_reviews,
            location: artisanData.location,
            verified: artisanData.verified,
            bio: artisanData.bio || 'No bio available',
            completedJobs: artisanData.completed_jobs,
            responseTime: artisanData.response_time,
            availability: artisanData.availability,
          });
        }

        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .eq('artisan_id', id);

        if (servicesError) {
          console.error('Error fetching services:', servicesError);
        } else if (servicesData) {
          setServices(servicesData.map(s => ({
            id: s.id,
            name: s.name,
            price: `₦${s.price_min.toLocaleString()} - ₦${s.price_max.toLocaleString()}`,
            duration: s.duration,
          })));
        }

        // Fetch reviews
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('artisan_id', id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (reviewsError) {
          console.error('Error fetching reviews:', reviewsError);
        } else if (reviewsData) {
          setReviews(reviewsData.map(r => ({
            id: r.id,
            author: r.reviewer_name,
            rating: r.rating,
            date: new Date(r.created_at).toLocaleDateString(),
            text: r.comment,
          })));
        }

        // Fetch portfolio photos
        const { data: portfolioData, error: portfolioError } = await supabase
          .from('portfolio_photos')
          .select('photo_url')
          .eq('artisan_id', id)
          .order('display_order', { ascending: true });

        if (portfolioError) {
          console.error('Error fetching portfolio:', portfolioError);
        } else if (portfolioData) {
          setPortfolioPhotos(portfolioData.map(p => p.photo_url));
        }

        // Fetch before/after projects
        const { data: beforeAfterData, error: beforeAfterError } = await supabase
          .from('before_after_photos')
          .select('id, project_title, project_description, before_photo_url, after_photo_url')
          .eq('artisan_id', id)
          .order('display_order', { ascending: true });

        if (beforeAfterError) {
          console.error('Error fetching before/after:', beforeAfterError);
        } else if (beforeAfterData) {
          setBeforeAfterProjects(beforeAfterData);
        }

        // Fetch artisan badges
        const { data: badgesData, error: badgesError } = await supabase
          .from('artisan_badges')
          .select('badge_type')
          .eq('artisan_id', id);

        if (badgesError) {
          console.error('Error fetching badges:', badgesError);
        } else if (badgesData) {
          setBadges(badgesData.map(b => b.badge_type));
        }

        // Fetch video testimonials
        const { data: videoData, error: videoError } = await supabase
          .from('video_testimonials')
          .select(`
            id,
            video_url,
            duration_seconds,
            rating,
            customer_id,
            profiles!video_testimonials_customer_id_fkey(full_name)
          `)
          .eq('artisan_id', id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (videoError) {
          console.error('Error fetching video testimonials:', videoError);
        } else if (videoData) {
          setVideoTestimonials(videoData.map((v: any) => ({
            id: v.id,
            customer_name: v.profiles?.full_name || 'Customer',
            rating: v.rating,
            video_url: v.video_url,
            duration_seconds: v.duration_seconds,
          })));
        }

        // Fetch service packages
        const { data: packagesData, error: packagesError } = await supabase
          .from('service_packages')
          .select(`
            id,
            package_name,
            description,
            original_price,
            discounted_price,
            discount_percentage
          `)
          .eq('artisan_id', id)
          .eq('is_active', true);

        if (packagesError) {
          console.error('Error fetching packages:', packagesError);
        } else if (packagesData) {
          // Fetch services for each package
          const packagesWithServices = await Promise.all(
            packagesData.map(async (pkg) => {
              const { data: pkgServices } = await supabase
                .from('package_services')
                .select(`
                  services(id, name, price, duration)
                `)
                .eq('package_id', pkg.id);

              return {
                ...pkg,
                services: pkgServices?.map((ps: any) => ps.services) || [],
              };
            })
          );
          setServicePackages(packagesWithServices);
        }
      } catch (err) {
        console.error('Error in fetchArtisanData:', err);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchArtisanData();
    }
  }, [id]);

  // Handle quote submission
  const handleQuoteSubmit = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to request a quote.');
      return;
    }

    if (!quoteForm.serviceDescription || !quoteForm.location) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.openId)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Insert booking
      const { error } = await supabase.from('bookings').insert({
        customer_id: profile.id,
        artisan_id: id,
        booking_type: 'quote',
        service_description: quoteForm.serviceDescription,
        location: quoteForm.location,
        preferred_date: quoteForm.preferredDate || null,
        customer_notes: quoteForm.notes || null,
      });

      if (error) throw error;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Send local notification
      await sendLocalNotification(
        'Quote Requested!',
        `Your quote request has been sent to ${artisan?.name}.`,
        { type: 'quote', artisanId: id }
      );

      Alert.alert(
        'Quote Requested!',
        `Your quote request has been sent to ${artisan?.name}. They will respond soon.`,
        [{ text: 'OK', onPress: () => setShowQuoteModal(false) }]
      );

      // Reset form
      setQuoteForm({
        serviceDescription: '',
        location: '',
        preferredDate: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error submitting quote:', error);
      Alert.alert('Error', 'Failed to submit quote request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle booking submission
  const handleBookingSubmit = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please sign in to book a service.');
      return;
    }

    if (!bookingForm.selectedService || !bookingForm.preferredDate || !bookingForm.preferredTime || !bookingForm.location) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.openId)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Get selected service details
      const selectedService = services.find(s => s.id === bookingForm.selectedService);

      // Insert booking
      const { data: newBooking, error } = await supabase.from('bookings').insert({
        customer_id: profile.id,
        artisan_id: id,
        service_id: bookingForm.selectedService,
        booking_type: 'instant',
        service_description: bookingForm.serviceDescription,
        preferred_date: `${bookingForm.preferredDate} ${bookingForm.preferredTime}`,
        location: bookingForm.location,
        payment_method: bookingForm.paymentMethod,
        customer_notes: bookingForm.notes || null,
      }).select('id').single();
      if (error) throw error;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Send local notification
      await sendLocalNotification(
        'Booking Confirmed!',
        `Your booking with ${artisan?.name} has been confirmed.`,
        { type: 'booking', artisanId: id }
      );

      setShowBookingModal(false);
      // Navigate to confirmation screen
      if (newBooking?.id) {
        router.push(`/booking/confirmation?bookingId=${newBooking.id}` as never);
      } else {
        Alert.alert(
          'Booking Confirmed!',
          `Your booking with ${artisan?.name} has been confirmed. You will receive a notification once the artisan accepts.`
        );
      }

      // Reset form
      setBookingForm({
        selectedService: '',
        serviceDescription: '',
        preferredDate: '',
        preferredTime: '',
        location: '',
        paymentMethod: 'cash',
        notes: '',
      });
    } catch (error) {
      console.error('Error submitting booking:', error);
      Alert.alert('Error', 'Failed to confirm booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0a7ea4" />
          <Text className="text-muted text-sm mt-4">Loading artisan profile...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!artisan) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-foreground text-lg font-semibold mb-2">Artisan Not Found</Text>
          <Text className="text-muted text-sm text-center mb-4">The artisan profile you're looking for doesn't exist.</Text>
          <TouchableOpacity onPress={() => router.back()} className="bg-primary px-6 py-3 rounded-full">
            <Text className="text-background font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const renderReview = ({ item }: { item: Review }) => (
    <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
            <Text className="text-background font-bold">{item.author.charAt(0)}</Text>
          </View>
          <View>
            <Text className="text-sm font-semibold text-foreground">{item.author}</Text>
            <Text className="text-xs text-muted">{item.date}</Text>
          </View>
        </View>
        <View className="flex-row items-center">
          <Text className="text-warning mr-1">⭐</Text>
          <Text className="text-sm font-medium text-foreground">{item.rating}</Text>
        </View>
      </View>
      <Text className="text-sm text-muted leading-relaxed">{item.text}</Text>
      {item.photos && item.photos.length > 0 && (
        <View className="flex-row gap-2 mt-3">
          {item.photos.map((photo, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setGalleryPhotos(item.photos!);
                setGalleryInitialIndex(index);
                setGalleryVisible(true);
              }}
            >
              <Image
                source={{ uri: photo }}
                className="w-20 h-20 rounded-lg"
              />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderService = ({ item }: { item: Service }) => (
    <View className="bg-surface rounded-xl p-4 mb-3 border border-border">
      <Text className="text-base font-semibold text-foreground mb-2">{item.name}</Text>
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-sm text-primary font-medium">{item.price}</Text>
          <Text className="text-xs text-muted mt-1">⏱️ {item.duration}</Text>
        </View>
        <TouchableOpacity className="bg-primary px-4 py-2 rounded-full">
          <Text className="text-background text-xs font-semibold">Book</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View className="px-6 pt-4 pb-2">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-2xl">←</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                try {
                  await Share.share({
                    title: `${artisan.name} — ${artisan.service} on EketSupply`,
                    message: `Check out ${artisan.name}, a verified ${artisan.service} on EketSupply!\n\n⭐ ${artisan.rating} rating · ${artisan.completedJobs} jobs done\n📍 ${artisan.location}\n\nBook them on EketSupply: https://www.eketsupply.com`,
                  });
                } catch (err) {
                  console.error('Share error:', err);
                }
              }}
              style={{
                backgroundColor: '#F0F7F0',
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 16 }}>📤</Text>
              <Text style={{ color: '#1B5E20', fontWeight: '600', fontSize: 13 }}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Header */}
        <View className="px-6 mb-6">
          <View className="flex-row items-center mb-4">
            <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mr-4">
              <Text className="text-background text-3xl font-bold">{artisan.name.charAt(0)}</Text>
            </View>
            <View className="flex-1">
              <View className="flex-row items-center mb-1">
                <Text className="text-xl font-bold text-foreground">{artisan.name}</Text>
                {artisan.verified && (
                  <View className="ml-2">
                    <VerifiedBadge size="small" />
                  </View>
                )}
              </View>
              <Text className="text-sm text-muted mb-2">{artisan.service}</Text>
              <View className="flex-row items-center">
                <Text className="text-warning mr-1">⭐</Text>
                <Text className="text-sm font-medium text-foreground">{artisan.rating}</Text>
                <Text className="text-sm text-muted ml-1">({artisan.reviews} reviews)</Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row justify-between bg-surface rounded-xl p-4 border border-border mb-4">
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-foreground">{artisan.completedJobs}</Text>
              <Text className="text-xs text-muted mt-1">Jobs Done</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-foreground">{artisan.rating}</Text>
              <Text className="text-xs text-muted mt-1">Rating</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-foreground">{artisan.reviews}</Text>
              <Text className="text-xs text-muted mt-1">Reviews</Text>
            </View>
          </View>

          {/* Quick Info */}
          <View className="bg-surface rounded-xl p-4 border border-border mb-4">
            <View className="flex-row items-center mb-2">
              <Text className="text-muted mr-2">📍</Text>
              <Text className="text-sm text-foreground">{artisan.location}</Text>
            </View>
            <View className="flex-row items-center mb-2">
              <Text className="text-muted mr-2">⏰</Text>
              <Text className="text-sm text-foreground">{artisan.availability}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-muted mr-2">💬</Text>
              <Text className="text-sm text-foreground">Responds {artisan.responseTime}</Text>
            </View>
          </View>

          {/* Achievement Badges */}
          {badges.length > 0 && (
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <Text className="text-sm font-semibold text-foreground mb-3">Achievement Badges</Text>
              <ArtisanBadges badges={badges} size="medium" />
            </View>
          )}

          {/* Bio */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-foreground mb-2">About</Text>
            <Text className="text-sm text-muted leading-relaxed">{artisan.bio}</Text>
          </View>
        </View>

        {/* Services */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Services Offered</Text>
          {services.length > 0 ? (
            <FlatList
              data={services}
              renderItem={renderService}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View className="items-center py-8">
              <Text className="text-muted text-sm">No services listed</Text>
            </View>
          )}
        </View>

        {/* Service Packages */}
        {servicePackages.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">Service Packages</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
              {servicePackages.map((pkg) => (
                <View key={pkg.id} className="mx-1" style={{ width: 300 }}>
                  <View className="bg-surface rounded-xl overflow-hidden border border-border">
                    {/* Package Header */}
                    <View className="p-4 border-b border-border">
                      <Text className="text-foreground font-bold text-lg mb-1">
                        {pkg.package_name}
                      </Text>
                      {pkg.description && (
                        <Text className="text-muted text-sm" numberOfLines={2}>
                          {pkg.description}
                        </Text>
                      )}
                    </View>

                    {/* Pricing */}
                    <View className="p-4 bg-primary/5">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Text className="text-muted text-sm line-through">
                          ₦{pkg.original_price.toLocaleString()}
                        </Text>
                        <View className="bg-error/20 px-2 py-1 rounded">
                          <Text className="text-error text-xs font-bold">
                            {pkg.discount_percentage}% OFF
                          </Text>
                        </View>
                      </View>
                      <Text className="text-primary text-2xl font-bold">
                        ₦{pkg.discounted_price.toLocaleString()}
                      </Text>
                    </View>

                    {/* Services List */}
                    <View className="p-4">
                      <Text className="text-xs font-semibold text-muted mb-2">INCLUDES:</Text>
                      {pkg.services.map((service) => (
                        <View key={service.id} className="flex-row items-center gap-2 mb-1">
                          <Text className="text-success">✓</Text>
                          <Text className="text-foreground text-sm">{service.name}</Text>
                        </View>
                      ))}
                    </View>

                    {/* Book Button */}
                    <TouchableOpacity
                      onPress={() => setShowBookingModal(true)}
                      className="bg-primary p-3 items-center"
                    >
                      <Text className="text-white font-semibold">Book Package</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Portfolio */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Portfolio</Text>
          {portfolioPhotos.length > 0 ? (
            <View className="flex-row flex-wrap">
              {portfolioPhotos.map((photoUrl, index) => (
                <TouchableOpacity
                  key={index}
                  className="w-1/2 p-1"
                  onPress={() => {
                    setGalleryPhotos(portfolioPhotos);
                    setGalleryInitialIndex(index);
                    setGalleryVisible(true);
                  }}
                >
                  <View className="bg-surface rounded-xl overflow-hidden border border-border" style={{ height: 150 }}>
                    <Image
                      source={{ uri: photoUrl }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-8 items-center justify-center border border-border">
              <Text className="text-4xl mb-2">🖼️</Text>
              <Text className="text-muted text-sm">No portfolio photos yet</Text>
            </View>
          )}
        </View>

        {/* Before/After Transformations */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-bold text-foreground mb-3">Before/After Transformations</Text>
          {beforeAfterProjects.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
              {beforeAfterProjects.map((project, index) => (
                <TouchableOpacity
                  key={project.id}
                  onPress={() => {
                    setBeforeAfterInitialIndex(index);
                    setBeforeAfterViewerVisible(true);
                  }}
                  className="mx-1"
                  style={{ width: 280 }}
                >
                  <View className="bg-surface rounded-xl overflow-hidden border border-border">
                    {/* Title */}
                    <View className="p-3 border-b border-border">
                      <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
                        {project.project_title}
                      </Text>
                      {project.project_description && (
                        <Text className="text-muted text-xs mt-1" numberOfLines={2}>
                          {project.project_description}
                        </Text>
                      )}
                    </View>
                    
                    {/* Side-by-side preview */}
                    <View className="flex-row">
                      <View className="flex-1 p-2">
                        <Text className="text-xs text-muted font-semibold mb-1 text-center">BEFORE</Text>
                        <Image
                          source={{ uri: project.before_photo_url }}
                          className="w-full aspect-[4/3] rounded-lg"
                          resizeMode="cover"
                        />
                      </View>
                      <View className="flex-1 p-2">
                        <Text className="text-xs text-success font-semibold mb-1 text-center">AFTER</Text>
                        <Image
                          source={{ uri: project.after_photo_url }}
                          className="w-full aspect-[4/3] rounded-lg"
                          resizeMode="cover"
                        />
                      </View>
                    </View>
                    
                    {/* Tap hint */}
                    <View className="p-2 bg-primary/10 items-center">
                      <Text className="text-primary text-xs font-medium">Tap to view fullscreen</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View className="bg-surface rounded-xl p-8 items-center justify-center border border-border">
              <Text className="text-4xl mb-2">🔄</Text>
              <Text className="text-muted text-sm">No before/after projects yet</Text>
            </View>
          )}
        </View>

        {/* Video Testimonials */}
        {videoTestimonials.length > 0 && (
          <View className="px-6 mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">Video Testimonials</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1">
              {videoTestimonials.map((video) => (
                <View key={video.id} className="mx-1" style={{ width: 300 }}>
                  <VideoTestimonialPlayer
                    videoUrl={video.video_url}
                    customerName={video.customer_name}
                    rating={video.rating}
                    duration={video.duration_seconds}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Reviews */}
        <View className="px-6 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-foreground">Reviews ({artisan.reviews})</Text>
            <TouchableOpacity>
              <Text className="text-sm text-primary font-medium">See All</Text>
            </TouchableOpacity>
          </View>
          {reviews.length > 0 ? (
            <FlatList
              data={reviews}
              renderItem={renderReview}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View className="items-center py-8">
              <Text className="text-muted text-sm">No reviews yet</Text>
            </View>
          )}
        </View>

        {/* Bottom Padding for Fixed Buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Fixed Bottom Action Buttons */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-6 py-4">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={() => setShowQuoteModal(true)}
            className="flex-1 bg-surface border-2 border-primary rounded-full py-4"
          >
            <Text className="text-primary text-center font-semibold">Request Quote</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowBookingModal(true)}
            className="flex-1 bg-primary rounded-full py-4"
          >
            <Text className="text-background text-center font-semibold">Book Now</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Request Quote Modal */}
      <Modal
        visible={showQuoteModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowQuoteModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl px-6 pt-6 pb-8" style={{ maxHeight: '90%' }}>
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-foreground">Request Quote</Text>
              <TouchableOpacity onPress={() => setShowQuoteModal(false)}>
                <Text className="text-2xl text-muted">×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Service Description */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">Service Needed *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Describe the service you need..."
                  placeholderTextColor="#9BA1A6"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={quoteForm.serviceDescription}
                  onChangeText={(text) => setQuoteForm({...quoteForm, serviceDescription: text})}
                />
              </View>

              {/* Location */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">Location *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Enter your location"
                  placeholderTextColor="#9BA1A6"
                  value={quoteForm.location}
                  onChangeText={(text) => setQuoteForm({...quoteForm, location: text})}
                />
              </View>

              {/* Preferred Date */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">Preferred Date (Optional)</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="e.g., Next Monday or 2026-02-20"
                  placeholderTextColor="#9BA1A6"
                  value={quoteForm.preferredDate}
                  onChangeText={(text) => setQuoteForm({...quoteForm, preferredDate: text})}
                />
              </View>

              {/* Additional Notes */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-2">Additional Notes</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Any specific requirements or questions?"
                  placeholderTextColor="#9BA1A6"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={quoteForm.notes}
                  onChangeText={(text) => setQuoteForm({...quoteForm, notes: text})}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleQuoteSubmit}
                disabled={submitting}
                className="bg-primary rounded-full py-4 mb-4"
                style={{ opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-background text-center font-semibold text-base">Submit Quote Request</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Instant Booking Modal */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBookingModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl px-6 pt-6 pb-8" style={{ maxHeight: '90%' }}>
            {/* Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-foreground">Book Now</Text>
              <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                <Text className="text-2xl text-muted">×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Select Service */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">Select Service *</Text>
                {services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    onPress={() => setBookingForm({...bookingForm, selectedService: service.id, serviceDescription: service.name})}
                    className={`bg-surface border-2 rounded-xl p-4 mb-2 ${
                      bookingForm.selectedService === service.id ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <Text className="text-base font-semibold text-foreground mb-1">{service.name}</Text>
                    <View className="flex-row justify-between items-center">
                      <Text className="text-sm text-muted">{service.duration}</Text>
                      <Text className="text-sm font-medium text-primary">{service.price}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Date & Time with Availability Calendar */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-3">Select Date & Time *</Text>
                <AvailabilityCalendar
                  artisanId={id as string}
                  selectedDate={bookingForm.preferredDate}
                  selectedTime={bookingForm.preferredTime}
                  onSelectSlot={(date, time) => {
                    setBookingForm({
                      ...bookingForm,
                      preferredDate: date,
                      preferredTime: time,
                    });
                  }}
                />
                {bookingForm.preferredDate && bookingForm.preferredTime && (
                  <View className="mt-3 bg-primary/10 rounded-xl p-3">
                    <Text className="text-sm text-primary font-medium">
                      Selected: {bookingForm.preferredDate} at {bookingForm.preferredTime}
                    </Text>
                  </View>
                )}
              </View>

              {/* Location */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">Service Location *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Enter your address"
                  placeholderTextColor="#9BA1A6"
                  value={bookingForm.location}
                  onChangeText={(text) => setBookingForm({...bookingForm, location: text})}
                />
              </View>

              {/* Payment Method */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-2">Payment Method *</Text>
                <View className="flex-row flex-wrap gap-2">
                  {['cash', 'transfer', 'card', 'escrow'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      onPress={() => setBookingForm({...bookingForm, paymentMethod: method})}
                      className={`px-4 py-2 rounded-full border-2 ${
                        bookingForm.paymentMethod === method
                          ? 'bg-primary border-primary'
                          : 'bg-surface border-border'
                      }`}
                    >
                      <Text className={`text-sm font-medium ${
                        bookingForm.paymentMethod === method ? 'text-background' : 'text-foreground'
                      }`}>
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Additional Notes */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-foreground mb-2">Special Instructions</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                  placeholder="Any special instructions for the artisan?"
                  placeholderTextColor="#9BA1A6"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={bookingForm.notes}
                  onChangeText={(text) => setBookingForm({...bookingForm, notes: text})}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleBookingSubmit}
                disabled={submitting}
                className="bg-primary rounded-full py-4 mb-4"
                style={{ opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-background text-center font-semibold text-base">Confirm Booking</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Photo Gallery Viewer */}
      <PhotoGalleryViewer
        visible={galleryVisible}
        onClose={() => setGalleryVisible(false)}
        photos={galleryPhotos}
        initialIndex={galleryInitialIndex}
      />

      {/* Before/After Viewer */}
      <BeforeAfterViewer
        visible={beforeAfterViewerVisible}
        onClose={() => setBeforeAfterViewerVisible(false)}
        projects={beforeAfterProjects}
        initialIndex={beforeAfterInitialIndex}
      />
    </ScreenContainer>
  );
}
