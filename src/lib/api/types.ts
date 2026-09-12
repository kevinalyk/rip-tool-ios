export type MessageType = 'email' | 'sms';

export type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

export type LoginUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
};

export type MobileClientEntitlements = {
  canSearchAndFilterFeed: boolean;
  canUseAlerts: boolean;
  feedHistoryHours: number | null;
  followedEntityLimit: number | null;
};

export type ClientProfile = {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  hasCompetitiveInsights: boolean;
  trialExpiresAt: string | null;
  // Optional during the backend-first rollout; missing capabilities fail closed.
  entitlements?: MobileClientEntitlements;
};

export type UserProfile = LoginUser & {
  firstLogin: boolean;
  client: ClientProfile | null;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: LoginUser;
};

export type RefreshResponse = Pick<LoginResponse, 'accessToken' | 'refreshToken' | 'expiresIn' | 'tokenType'>;

export type Entity = {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  party: string | null;
  state: string | null;
  imageUrl?: string | null;
  office?: string | null;
};

export type DirectoryEntity = Entity & {
  description: string | null;
  imageUrl: string | null;
  office: string | null;
  isFollowing: boolean;
  counts: {
    emails: number;
    sms: number;
    total: number;
  };
};

export type DirectoryFilters = {
  search?: string;
  party?: string;
  state?: string;
  entityType?: string;
};

export type DirectoryPage = {
  data: DirectoryEntity[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
    totalCount: number;
  };
};

export type DirectoryOptions = {
  states: string[];
  parties: SelectOption[];
  entityTypes: SelectOption[];
};

export type DirectoryRecentMessage = {
  id: string;
  type: MessageType;
  title: string;
  sender: string;
  dateReceived: string;
};

export type DirectoryEntityDetail = DirectoryEntity & {
  bio: string | null;
  ballotpediaUrl: string | null;
  emailSenders: string[];
  smsSenders: string[];
  recentMessages: DirectoryRecentMessage[];
};

export type FeedItem = {
  id: string;
  type: MessageType;
  senderName: string;
  senderEmail: string;
  subject: string;
  dateReceived: string;
  inboxRate: number;
  entityId: string | null;
  entity: Entity | null;
};

export type CtaLink = {
  url: string;
  originalUrl?: string;
  finalUrl?: string;
  text?: string;
  label?: string;
};

export type FeedDetail = FeedItem & {
  emailContent?: string | null;
  emailPreview?: string | null;
  ctaLinks?: unknown;
};

export type FeedShare = {
  shareToken: string;
  shareUrl: string;
};

export type FollowingPushPreference = {
  registered: boolean;
  enabled: boolean;
  lastSeenAt: string | null;
};

export type AnnouncementSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  publishedAt: string;
  updatedAt: string;
};

export type AnnouncementDetail = AnnouncementSummary & {
  body: string;
};

export type AnnouncementPage = {
  data: AnnouncementSummary[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export type FeedPage = {
  data: FeedItem[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export type SavedFeedView = {
  id: string;
  name: string;
  filters: FeedFilters;
  createdAt: string;
  updatedAt: string;
};

export type SelectOption = {
  value: string;
  label: string;
  match?: string;
};

export type FeedFilterOptions = {
  states: string[];
  parties: SelectOption[];
  entityTypes?: SelectOption[];
  messageFilters?: SelectOption[];
  donationPlatforms?: SelectOption[];
  entities?: FeedFilterEntity[];
};

export type AlertFilterOptions = {
  states: string[];
  parties: SelectOption[];
  entityTypes: SelectOption[];
  messageTypes: SelectOption[];
  ownershipTypes: SelectOption[];
  donationPlatforms: SelectOption[];
  entities: FeedFilterEntity[];
  tags: SelectOption[];
};

export type FeedFilterEntity = Pick<Entity, 'id' | 'name' | 'type' | 'party' | 'state'> & {
  isFollowing: boolean;
};

export type MessageFilter = 'email' | 'sms' | 'third_party' | 'house_file';

export type FeedFilters = {
  search?: string;
  entityIds?: string[];
  party?: string;
  state?: string;
  entityType?: string;
  messageFilters?: MessageFilter[];
  donationPlatform?: string;
  fromDate?: string;
  toDate?: string;
  subscriptionsOnly?: boolean;
};

export type AlertSubscription = {
  id: string;
  userId: string;
  name: string;
  party: string | null;
  state: string | null;
  search: string | null;
  entityIds: string[];
  entityType: string | null;
  messageTypes: MessageType[];
  ownershipTypes: ('house_file' | 'third_party')[];
  donationPlatform: string | null;
  subscriptionsOnly: boolean;
  tag: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAlertInput = {
  name: string;
  search?: string;
  entityIds?: string[];
  party?: string;
  state?: string;
  entityType?: string;
  messageTypes?: MessageType[];
  ownershipTypes?: ('house_file' | 'third_party')[];
  donationPlatform?: string;
  subscriptionsOnly?: boolean;
  tag?: string;
};
