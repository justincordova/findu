# Discover Photo Gallery & User Profile Modal - Implementation Plan

## Overview
Transform the Discover page to show full photo gallery with carousel navigation, and add a reusable profile modal that slides up from the bottom for viewing other users' complete profiles.

---

## Phase 1: Create Reusable Profile Component

### Task 1.1: Create ProfileView Component (Read-Only Wrapper)
**File:** `client/components/profile/ProfileView.tsx`

Create a wrapper component that composes all existing profile sections in read-only mode:

```typescript
interface ProfileViewProps {
  userId: string;  // User whose profile to display
  isEditable?: boolean;  // Default: false (read-only)
}

export default function ProfileView({ userId, isEditable = false }: ProfileViewProps) {
  // Fetch profile for userId (not current user)
  // Use ProfileContext to share data with sections
  // Pass isEditable={isEditable} to sections that need it
  // Sections will conditionally render edit buttons/modals based on this prop

  return (
    <ProfileContext.Provider value={{ profile: profileData, refetch, isEditable }}>
      <ScrollView>
        <UserInfoSection />
        <PhotosSection />
        <BioSection />
        <InterestsSection />
        <AcademicSection />
        <PreferencesSection />
        <LifestyleSection />
      </ScrollView>
    </ProfileContext.Provider>
  );
}
```

**Key details:**
- Pass `isEditable={false}` to ProfileContext
- All sections will check this flag and hide edit UI
- Fetch profile using userId parameter via API
- Handle loading/error states

### Task 1.2: Update ProfileContext to Support isEditable Flag
**File:** `client/contexts/ProfileContext.ts`

Add `isEditable` to context:
```typescript
interface ProfileContextType {
  profile: any;
  refetch: () => Promise<void>;
  isEditable?: boolean;  // NEW
}
```

### Task 1.3: Update Profile Sections to Respect isEditable
Update these components to conditionally render edit UI:
- `PhotosSection.tsx` - Hide upload/replace functionality
- `BioSection.tsx` - Hide edit button
- `InterestsSection.tsx` - Hide add/remove buttons
- `AcademicSection.tsx` - Hide edit button
- `PreferencesSection.tsx` - Hide edit button
- `LifestyleSection.tsx` - Hide edit button
- `UserInfoSection.tsx` - Hide edit button

**Pattern for each:**
```typescript
const { isEditable } = useProfile();

if (!isEditable && editButton) {
  // Don't render edit button
}
```

---

## Phase 2: Create Photo Gallery Component for Discover Card

### Task 2.1: Create PhotoGalleryCard Component
**File:** `client/components/discover/PhotoGalleryCard.tsx`

Replaces the simple image in SwipeCard with an interactive photo gallery:

```typescript
interface PhotoGalleryCardProps {
  photos: string[];  // Array of photo URLs
  onPhotoTap: () => void;  // Callback when profile picture tapped
  isActive: boolean;  // Enable/disable click interactions
}

export default function PhotoGalleryCard({
  photos,
  onPhotoTap,
  isActive
}: PhotoGalleryCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  return (
    <View>
      {/* Main photo - fill the card */}
      <Image source={{ uri: photos[currentPhotoIndex] }} />

      {/* Left/right click zones to advance gallery */}
      <Pressable
        onPress={() => setCurrentPhotoIndex(prev => Math.max(0, prev - 1))}
        style={styles.leftClickZone}
      />
      <Pressable
        onPress={() => setCurrentPhotoIndex(prev => Math.min(photos.length - 1, prev + 1))}
        style={styles.rightClickZone}
      />

      {/* Progress indicators at TOP */}
      <View style={styles.indicatorsTop}>
        {photos.map((_, idx) => (
          <View key={idx} style={[
            styles.dot,
            idx === currentPhotoIndex && styles.dotActive
          ]} />
        ))}
      </View>

      {/* Profile picture circle in bottom right - clickable */}
      <Pressable
        onPress={onPhotoTap}
        style={styles.profileCircle}
      >
        <Image source={{ uri: photos[0] }} />
      </Pressable>
    </View>
  );
}
```

**Key details:**
- Main image fills the card (like current)
- Click left/right 40% of card width to navigate
- Progress dots at top (similar to PhotosSection but at top)
- Profile picture (first photo) in bottom-right as small circle
- Clicking profile circle triggers lightbox

### Task 2.2: Create PhotoLightbox Component
**File:** `client/components/discover/PhotoLightbox.tsx`

Modal that shows single photo expanded with darkened background:

```typescript
interface PhotoLightboxProps {
  uri: string;
  visible: boolean;
  onClose: () => void;
}

export default function PhotoLightbox({ uri, visible, onClose }: PhotoLightboxProps) {
  return (
    <Modal visible={visible} transparent>
      {/* Dark background - tap to close */}
      <Pressable
        onPress={onClose}
        style={styles.backdrop}
      >
        {/* Image in center - don't close on tap */}
        <Pressable onPress={e => e.stopPropagation()}>
          <Image source={{ uri }} style={styles.image} />
        </Pressable>
      </Pressable>

      {/* Optional X button top right */}
      <Pressable onPress={onClose} style={styles.closeButton}>
        <Ionicons name="close" size={24} color="white" />
      </Pressable>
    </Modal>
  );
}
```

### Task 2.3: Update SwipeCard to Use PhotoGalleryCard
**File:** `client/components/discover/SwipeCard.tsx`

Replace ImageBackground with new PhotoGalleryCard:

```typescript
// OLD:
<ImageBackground source={{ uri: profile.avatar_url }} ... />

// NEW:
const [showLightbox, setShowLightbox] = useState(false);
const [lightboxUri, setLightboxUri] = useState("");

const handleProfilePictureTap = () => {
  setLightboxUri(profile.photos?.[0] || profile.avatar_url);
  setShowLightbox(true);
};

return (
  <>
    <PhotoGalleryCard
      photos={profile.photos || [profile.avatar_url]}
      onPhotoTap={handleProfilePictureTap}
      isActive={active}
    />

    <PhotoLightbox
      uri={lightboxUri}
      visible={showLightbox}
      onClose={() => setShowLightbox(false)}
    />

    {/* Rest of overlays, gradients, etc. remain unchanged */}
  </>
);
```

---

## Phase 3: Create Profile Modal for Discover

### Task 3.1: Create UserProfileModal Component
**File:** `client/components/discover/UserProfileModal.tsx`

Bottom-sheet style modal that animates up:

```typescript
interface UserProfileModalProps {
  visible: boolean;
  userId: string;
  onDismiss: () => void;
}

export default function UserProfileModal({
  visible,
  userId,
  onDismiss
}: UserProfileModalProps) {
  const slideAnimation = useSharedValue(1);  // 0 = up, 1 = down

  // Animate in when visible
  useEffect(() => {
    slideAnimation.value = withSpring(0);  // Slide up
  }, [visible]);

  // Handle swipe down to dismiss
  const gesture = Gesture.Pan()
    .onUpdate(e => {
      if (e.translationY > 0) {
        slideAnimation.value = e.translationY;
      }
    })
    .onEnd(e => {
      if (e.velocityY > 500 || e.translationY > 100) {
        slideAnimation.value = withSpring(1);  // Slide down
        runOnJS(onDismiss)();
      } else {
        slideAnimation.value = withSpring(0);  // Snap back
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideAnimation.value * screenHeight }]
  }));

  return (
    <Modal visible={visible} transparent>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          {/* Optional X button top right */}
          <Pressable onPress={onDismiss} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#333" />
          </Pressable>

          {/* Use ProfileView component */}
          <ProfileView userId={userId} isEditable={false} />
        </Animated.View>
      </GestureDetector>
    </Modal>
  );
}
```

**Key details:**
- Animated slide-up/down with gesture detection
- Swipe down triggers dismiss animation
- Optional X button top right
- Uses ProfileView component (reusable)

### Task 3.2: Update DiscoverScreen to Show Profile Modal
**File:** `client/app/home/(tabs)/discover.tsx`

Add state and modal to show user profile:

```typescript
const [showProfileModal, setShowProfileModal] = useState(false);
const [selectedUserId, setSelectedUserId] = useState<string>("");

const handleViewProfile = (userId: string) => {
  setSelectedUserId(userId);
  setShowProfileModal(true);
};

const handleProfileModalDismiss = () => {
  setShowProfileModal(false);
  // Return to current position - currentIndex stays same
};

return (
  <>
    {/* Existing swipe card rendering */}
    <SwipeCard
      profile={profile}
      onProfileTap={() => handleViewProfile(profile.user_id)}
      ...
    />

    {/* Profile modal */}
    <UserProfileModal
      visible={showProfileModal}
      userId={selectedUserId}
      onDismiss={handleProfileModalDismiss}
    />
  </>
);
```

### Task 3.3: Add Profile Button to SwipeCard
**File:** `client/components/discover/SwipeCard.tsx`

Add button to open profile modal:

```typescript
// Add prop
interface SwipeCardProps {
  ...
  onProfileTap?: () => void;  // NEW
}

// Add button (e.g., in top left corner near action menu)
<Pressable onPress={onProfileTap} style={styles.profileButton}>
  <Ionicons name="person-circle" size={32} color="white" />
</Pressable>
```

---

## Phase 4: Integration & Testing

### Task 4.1: Test Photo Gallery Navigation
- Click left/right zones to navigate photos
- Verify progress dots update correctly at top
- Verify profile picture circle displays first photo

### Task 4.2: Test Lightbox
- Tap profile picture circle
- Verify image expands and background darkens
- Tap background to close
- Verify back to gallery view

### Task 4.3: Test Profile Modal
- Tap profile button on card
- Verify modal slides up smoothly
- Verify all sections render read-only (no edit buttons)
- Swipe down to dismiss
- Verify returns to same card position
- Try X button to close

### Task 4.4: Test Full Flow
- Swipe through photos in discover card
- View full profile
- Close profile
- Swipe left/right to like/reject
- Next profile should appear

### Task 4.5: Lint & Format
```bash
npm run lint
```

---

## Files to Create
1. `client/components/profile/ProfileView.tsx` - Reusable read-only profile
2. `client/components/discover/PhotoGalleryCard.tsx` - Gallery with click zones
3. `client/components/discover/PhotoLightbox.tsx` - Image lightbox modal
4. `client/components/discover/UserProfileModal.tsx` - Bottom-sheet profile

## Files to Modify
1. `client/contexts/ProfileContext.ts` - Add isEditable flag
2. `client/components/profile/PhotosSection.tsx` - Respect isEditable
3. `client/components/profile/BioSection.tsx` - Respect isEditable
4. `client/components/profile/InterestsSection.tsx` - Respect isEditable
5. `client/components/profile/AcademicSection.tsx` - Respect isEditable
6. `client/components/profile/PreferencesSection.tsx` - Respect isEditable
7. `client/components/profile/LifestyleSection.tsx` - Respect isEditable
8. `client/components/profile/UserInfoSection.tsx` - Respect isEditable
9. `client/components/discover/SwipeCard.tsx` - Use PhotoGalleryCard
10. `client/app/home/(tabs)/discover.tsx` - Add profile modal state

## Notes
- No backend changes required
- Algorithm handles profile ordering/duplicates (not our concern)
- All animations use react-native-reanimated (already a dependency)
- Gesture handling uses react-native-gesture-handler (already a dependency)
- PhotosSection indicators style reused for gallery (slight adjustment to position)