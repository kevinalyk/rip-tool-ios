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

export type ClientProfile = {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  hasCompetitiveInsights: boolean;
  trialExpiresAt: string | null;
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
  text?: string;
  label?: string;
};

export type FeedDetail = FeedItem & {
  emailContent?: string | null;
  emailPreview?: string | null;
  ctaLinks?: unknown[];
};

export type FeedPage = {
  data: FeedItem[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

export type SelectOption = {
  value: string;
  label: string;
  match?: string;
};

export type FeedFilterOptions = {
  states: string[];
  parties: SelectOption[];
  offices: SelectOption[];
  entityTypes?: SelectOption[];
  messageFilters?: SelectOption[];
  donationPlatforms?: SelectOption[];
  entities?: FeedFilterEntity[];
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
  office: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateAlertInput = {
  name: string;
  party?: string;
  state?: string;
  office?: string;
};
