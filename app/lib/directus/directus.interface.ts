export type AuthorRoles = {
  date_created?: string | null;
  date_updated?: string | null;
  description?: string | null;
  id: number;
  rol_abbr?: string | null;
};

export type Authors = {
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  name?: string | null;
  related_hymns: any[] & HymnAuthors[];
};

export type BasicInfo = {
  date_created?: string | null;
  date_updated?: string | null;
  id: number;
  status: string;
  user_created?: (string & DirectusUsers) | null;
  user_updated?: (string & DirectusUsers) | null;
};

export type Brothers = {
  alias?: string | null;
  avatar?: (string & DirectusFiles) | null;
  date_created?: string | null;
  date_updated?: string | null;
  first_name?: string | null;
  id: string;
  last_name?: string | null;
  sort?: number | null;
  status?: string | null;
  user_created?: (string & DirectusUsers) | null;
  user_updated?: (string & DirectusUsers) | null;
};

export type ChurchEvents = {
  attachments: any[] & EventAttachments[];
  audience_note?: string | null;
  audiences: any[] & EventsAudiences[];
  category?: string | null;
  cover_image?: (string & DirectusFiles) | null;
  date_created?: string | null;
  date_updated?: string | null;
  description?: string | null;
  end_datetime?: string | null;
  id: string;
  is_online?: boolean | null;
  location?: (string & EventLocations) | null;
  meeting_link?: string | null;
  organizer?: (string & EventOrganizers) | null;
  recurrence?: unknown | null;
  sort?: number | null;
  start_datetime?: string | null;
  status?: string | null;
  tags: any[] & EventsTags[];
  title?: string | null;
  user_created?: string | null;
  user_updated?: string | null;
};

export type DirectusAccess = {
  id: string;
  policy: string & DirectusPolicies;
  role?: (string & DirectusRoles) | null;
  sort?: number | null;
  user?: (string & DirectusUsers) | null;
};

export type DirectusActivity = {
  action: string;
  collection: string;
  id: number;
  ip?: string | null;
  item: string;
  origin?: string | null;
  revisions: any[] & DirectusRevisions[];
  timestamp: string;
  user?: (string & DirectusUsers) | null;
  user_agent?: string | null;
};

export type DirectusCollections = {
  accountability?: string | null;
  archive_app_filter: boolean;
  archive_field?: string | null;
  archive_value?: string | null;
  collapse: string;
  collection: string;
  color?: string | null;
  display_template?: string | null;
  group?: (string & DirectusCollections) | null;
  hidden: boolean;
  icon?: string | null;
  item_duplication_fields?: unknown | null;
  note?: string | null;
  preview_url?: string | null;
  singleton: boolean;
  sort?: number | null;
  sort_field?: string | null;
  translations?: unknown | null;
  unarchive_value?: string | null;
  versioning: boolean;
};

export type DirectusComments = {
  collection: string;
  comment: string;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  item: string;
  user_created?: string | null;
  user_updated?: string | null;
};

export type DirectusDashboards = {
  color?: string | null;
  date_created?: string | null;
  icon: string;
  id: string;
  name: string;
  note?: string | null;
  panels: any[] & DirectusPanels[];
  user_created?: (string & DirectusUsers) | null;
};

export type DirectusExtensions = {
  bundle?: string | null;
  enabled: boolean;
  folder: string;
  id: string;
  source: string;
};

export type DirectusFields = {
  collection: string & DirectusCollections;
  conditions?: unknown | null;
  display?: string | null;
  display_options?: unknown | null;
  field: string;
  group?: (string & DirectusFields) | null;
  hidden: boolean;
  id: number;
  interface?: string | null;
  note?: string | null;
  options?: unknown | null;
  readonly: boolean;
  required?: boolean | null;
  sort?: number | null;
  special?: unknown | null;
  translations?: unknown | null;
  validation?: unknown | null;
  validation_message?: string | null;
  width?: string | null;
};

export type DirectusFiles = {
  charset?: string | null;
  created_on: string;
  description?: string | null;
  duration?: number | null;
  embed?: string | null;
  filename_disk?: string | null;
  filename_download: string;
  filesize?: number | null;
  focal_point_x?: number | null;
  focal_point_y?: number | null;
  folder?: (string & DirectusFolders) | null;
  height?: number | null;
  id: string;
  location?: string | null;
  metadata?: unknown | null;
  modified_by?: (string & DirectusUsers) | null;
  modified_on: string;
  storage: string;
  tags?: unknown | null;
  title?: string | null;
  tus_data?: unknown | null;
  tus_id?: string | null;
  type?: string | null;
  uploaded_by?: (string & DirectusUsers) | null;
  uploaded_on?: string | null;
  width?: number | null;
};

export type DirectusFlows = {
  accountability?: string | null;
  color?: string | null;
  date_created?: string | null;
  description?: string | null;
  icon?: string | null;
  id: string;
  name: string;
  operation?: (string & DirectusOperations) | null;
  operations: any[] & DirectusOperations[];
  options?: unknown | null;
  status: string;
  trigger?: string | null;
  user_created?: (string & DirectusUsers) | null;
};

export type DirectusFolders = {
  id: string;
  name: string;
  parent?: (string & DirectusFolders) | null;
};

export type DirectusMigrations = {
  name: string;
  timestamp?: string | null;
  version: string;
};

export type DirectusNotifications = {
  collection?: string | null;
  id: number;
  item?: string | null;
  message?: string | null;
  recipient: string & DirectusUsers;
  sender?: (string & DirectusUsers) | null;
  status?: string | null;
  subject: string;
  timestamp?: string | null;
};

export type DirectusOperations = {
  date_created?: string | null;
  flow: string & DirectusFlows;
  id: string;
  key: string;
  name?: string | null;
  options?: unknown | null;
  position_x: number;
  position_y: number;
  reject?: (string & DirectusOperations) | null;
  resolve?: (string & DirectusOperations) | null;
  type: string;
  user_created?: (string & DirectusUsers) | null;
};

export type DirectusPanels = {
  color?: string | null;
  dashboard: string & DirectusDashboards;
  date_created?: string | null;
  height: number;
  icon?: string | null;
  id: string;
  name?: string | null;
  note?: string | null;
  options?: unknown | null;
  position_x: number;
  position_y: number;
  show_header: boolean;
  type: string;
  user_created?: (string & DirectusUsers) | null;
  width: number;
};

export type DirectusPermissions = {
  action: string;
  collection: string;
  fields?: unknown | null;
  id: number;
  permissions?: unknown | null;
  policy: string & DirectusPolicies;
  presets?: unknown | null;
  validation?: unknown | null;
};

export type DirectusPolicies = {
  admin_access: boolean;
  app_access: boolean;
  description?: string | null;
  enforce_tfa: boolean;
  icon: string;
  id: string;
  ip_access?: unknown | null;
  name: string;
  permissions: any[] & DirectusPermissions[];
  roles: any[] & DirectusAccess[];
  users: any[] & DirectusAccess[];
};

export type DirectusPresets = {
  bookmark?: string | null;
  collection?: string | null;
  color?: string | null;
  filter?: unknown | null;
  icon?: string | null;
  id: number;
  layout?: string | null;
  layout_options?: unknown | null;
  layout_query?: unknown | null;
  refresh_interval?: number | null;
  role?: (string & DirectusRoles) | null;
  search?: string | null;
  user?: (string & DirectusUsers) | null;
};

export type DirectusRelations = {
  id: number;
  junction_field?: string | null;
  many_collection: string;
  many_field: string;
  one_allowed_collections?: unknown | null;
  one_collection?: string | null;
  one_collection_field?: string | null;
  one_deselect_action: string;
  one_field?: string | null;
  sort_field?: string | null;
};

export type DirectusRevisions = {
  activity: number & DirectusActivity;
  collection: string;
  data?: unknown | null;
  delta?: unknown | null;
  id: number;
  item: string;
  parent?: (number & DirectusRevisions) | null;
  version?: (string & DirectusVersions) | null;
};

export type DirectusRoles = {
  children: any[] & DirectusRoles[];
  description?: string | null;
  icon: string;
  id: string;
  name: string;
  parent?: (string & DirectusRoles) | null;
  policies: any[] & DirectusAccess[];
  users: any[] & DirectusUsers[];
  users_group: string;
};

export type DirectusSessions = {
  expires: string;
  ip?: string | null;
  next_token?: string | null;
  origin?: string | null;
  share?: (string & DirectusShares) | null;
  token: string;
  user?: (string & DirectusUsers) | null;
  user_agent?: string | null;
};

export type DirectusSettings = {
  auth_login_attempts?: number | null;
  auth_password_policy?: string | null;
  basemaps?: unknown | null;
  custom_aspect_ratios?: unknown | null;
  custom_css?: string | null;
  default_appearance: string;
  default_language: string;
  default_theme_dark?: string | null;
  default_theme_light?: string | null;
  id: number;
  mapbox_key?: string | null;
  module_bar?: unknown | null;
  project_color: string;
  project_descriptor?: string | null;
  project_logo?: (string & DirectusFiles) | null;
  project_name: string;
  project_url?: string | null;
  public_background?: (string & DirectusFiles) | null;
  public_favicon?: (string & DirectusFiles) | null;
  public_foreground?: (string & DirectusFiles) | null;
  public_note?: string | null;
  public_registration: boolean;
  public_registration_email_filter?: unknown | null;
  public_registration_role?: (string & DirectusRoles) | null;
  public_registration_verify_email: boolean;
  report_bug_url?: string | null;
  report_error_url?: string | null;
  report_feature_url?: string | null;
  storage_asset_presets?: unknown | null;
  storage_asset_transform?: string | null;
  storage_default_folder?: (string & DirectusFolders) | null;
  theme_dark_overrides?: unknown | null;
  theme_light_overrides?: unknown | null;
  theming_group: string;
  visual_editor_urls?: unknown | null;
};

export type DirectusShares = {
  collection: string & DirectusCollections;
  date_created?: string | null;
  date_end?: string | null;
  date_start?: string | null;
  id: string;
  item: string;
  max_uses?: number | null;
  name?: string | null;
  password?: string | null;
  role?: (string & DirectusRoles) | null;
  times_used?: number | null;
  user_created?: (string & DirectusUsers) | null;
};

export type DirectusTranslations = {
  id: string;
  key: string;
  language: string;
  value: string;
};

export type DirectusUsers = {
  appearance?: string | null;
  auth_data?: unknown | null;
  avatar?: (string & DirectusFiles) | null;
  description?: string | null;
  email?: string | null;
  email_notifications?: boolean | null;
  external_identifier?: string | null;
  first_name?: string | null;
  id: string;
  language?: string | null;
  last_access?: string | null;
  last_name?: string | null;
  last_page?: string | null;
  location?: string | null;
  password?: string | null;
  policies: any[] & DirectusAccess[];
  provider: string;
  role?: (string & DirectusRoles) | null;
  status: string;
  tags?: unknown | null;
  tfa_secret?: string | null;
  theme_dark?: string | null;
  theme_dark_overrides?: unknown | null;
  theme_light?: string | null;
  theme_light_overrides?: unknown | null;
  title?: string | null;
  token?: string | null;
};

export type DirectusVersions = {
  collection: string & DirectusCollections;
  date_created?: string | null;
  date_updated?: string | null;
  delta?: unknown | null;
  hash?: string | null;
  id: string;
  item: string;
  key: string;
  name?: string | null;
  user_created?: (string & DirectusUsers) | null;
  user_updated?: (string & DirectusUsers) | null;
};

export type DirectusWebhooks = {
  actions: unknown;
  collections: unknown;
  data: boolean;
  headers?: unknown | null;
  id: number;
  method: string;
  migrated_flow?: (string & DirectusFlows) | null;
  name: string;
  status: string;
  url: string;
  was_active_before_deprecation: boolean;
};

export type EventAttachments = {
  event_id?: (string & ChurchEvents) | null;
  file_id?: (string & DirectusFiles) | null;
  file_type?: string | null;
  id: string;
};

export type EventAudiences = {
  id: string;
  name?: string | null;
};

export type EventLocations = {
  address?: string | null;
  googleMaps_link?: string | null;
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  name?: string | null;
  room?: string | null;
  waze_link?: string | null;
};

export type EventOrganizers = {
  email?: string | null;
  id: string;
  ministry?: string | null;
  name?: string | null;
  phone?: string | null;
};

export type EventTags = {
  id: string;
  label?: string | null;
  slug?: string | null;
};

export type EventsAudiences = {
  audience_id?: (string & EventAudiences) | null;
  church_event_id?: (string & ChurchEvents) | null;
  id: string;
};

export type EventsTags = {
  church_event_id?: (string & ChurchEvents) | null;
  id: string;
  tag_id?: (string & EventTags) | null;
};

export type Global = {
  description?: string | null;
  id: number;
  title?: string | null;
};

export type Hymn = {
  alto_voice?: (string & DirectusFiles) | null;
  are_lyrics_exists?: boolean | null;
  authors: any[] & HymnAuthors[];
  bass_voice?: (string & DirectusFiles) | null;
  bible_reference?: string | null;
  bible_text?: string | null;
  categories: any[] & HymnHymnCategories[];
  date_created?: string | null;
  date_updated?: string | null;
  dynamic_track_midi?: (string & DirectusFiles) | null;
  files: any[] & HymnFiles[];
  formatedLyrics?: boolean | null;
  hymn_number?: number | null;
  hymn_programs: any[] & ProgramActivities[];
  hymn_time_signature?: string | null;
  hymnal?: (string & Hymnals) | null;
  hymnal_versions: any[] & HymnHymnalVersions[];
  id: string;
  is_pro_file_exists?: boolean | null;
  is_track_only_exists?: boolean | null;
  last_activity?: string | null;
  letter_hymn?: string | null;
  links_notes?: string | null;
  materials: string;
  midi_file?: (string & DirectusFiles) | null;
  name?: string | null;
  original_midi?: boolean | null;
  playground: string;
  pro_file?: (string & DirectusFiles) | null;
  related: string;
  related_programs: any[] & ProgramsHymn[];
  soprano_voice?: (string & DirectusFiles) | null;
  status?: string | null;
  temporaryFileds: string;
  tenor_voice?: (string & DirectusFiles) | null;
  track_only?: (string & DirectusFiles) | null;
  user_created?: (string & DirectusUsers) | null;
  user_updated?: (string & DirectusUsers) | null;
};

export type HymnAuthors = {
  author_roles: any[] & HymnAuthorsAuthorRoles[];
  authors_id?: (string & Authors) | null;
  hymn_id?: (string & Hymn) | null;
  id: number;
};

export type HymnAuthorsAuthorRoles = {
  author_roles_id?: (number & AuthorRoles) | null;
  hymn_authors_id?: (number & HymnAuthors) | null;
  id: number;
};

export type HymnCategories = {
  category_hymns: any[] & HymnHymnCategories[];
  date_created?: string | null;
  date_updated?: string | null;
  id: number;
  name?: string | null;
  status?: string | null;
  user_created?: (string & DirectusUsers) | null;
  user_updated?: (string & DirectusUsers) | null;
};

export type HymnFiles = {
  directus_files_id?: (string & DirectusFiles) | null;
  hymn_id?: (string & Hymn) | null;
  id: number;
};

export type HymnHymnCategories = {
  hymn_categories_id?: (number & HymnCategories) | null;
  hymn_id?: (string & Hymn) | null;
  id: number;
};

export type HymnHymnalVersions = {
  collection?: string | null;
  hymn_id?: (string & Hymn) | null;
  id: number;
  item?: (string & any) | null;
};

export type Hymnals = {
  cover?: (string & DirectusFiles) | null;
  date_created?: string | null;
  date_updated?: string | null;
  hymns: any[] & Hymn[];
  id: string;
  name?: string | null;
  publisher?: string | null;
  sort?: number | null;
  status?: string | null;
  user_created?: (string & DirectusUsers) | null;
  user_updated?: (string & DirectusUsers) | null;
};

export type ProgramActivities = {
  activities?: string | null;
  activity_hymn?: (string & Hymn) | null;
  activity_order?: number | null;
  activity_program?: (string & Programs) | null;
  activity_responsible?: (string & Brothers) | null;
  date_created?: string | null;
  date_updated?: string | null;
  description?: string | null;
  id: string;
  sort?: number | null;
  status?: string | null;
  user_created?: (string & DirectusUsers) | null;
  user_updated?: (string & DirectusUsers) | null;
};

export type Programs = {
  bible_reference?: string | null;
  bible_text?: string | null;
  date_created?: string | null;
  date_updated?: string | null;
  id: string;
  program_activities: any[] & ProgramActivities[];
  program_title?: string | null;
  selected_hymns: any[] & ProgramsHymn[];
  sort?: number | null;
  start_datetime?: string | null;
  status?: string | null;
  user_created?: (string & DirectusUsers) | null;
  user_updated?: (string & DirectusUsers) | null;
};

export type ProgramsHymn = {
  hymn_id?: (string & Hymn) | null;
  id: number;
  programs_id?: (string & Programs) | null;
};

export type ProgramsProgramActivities = {
  id: number;
  program_activities_id?: (string & ProgramActivities) | null;
  programs_id?: (string & Programs) | null;
};

export type TaskType = {
  description?: string | null;
  id: number;
};

export type Tasks = {
  assignee?: (string & Brothers) | null;
  date_created?: string | null;
  date_updated?: string | null;
  description?: string | null;
  due_date?: string | null;
  id: number;
  related_hymn?: (string & Hymn) | null;
  status?: string | null;
  task_type?: (number & TaskType) | null;
  title?: string | null;
  user_created?: (string & DirectusUsers) | null;
  user_updated?: (string & DirectusUsers) | null;
};

export type CustomDirectusTypes = {
  author_roles: AuthorRoles[];
  authors: Authors[];
  basic_info: BasicInfo;
  brothers: Brothers[];
  church_events: ChurchEvents[];
  directus_access: DirectusAccess[];
  directus_activity: DirectusActivity[];
  directus_collections: DirectusCollections[];
  directus_comments: DirectusComments[];
  directus_dashboards: DirectusDashboards[];
  directus_extensions: DirectusExtensions[];
  directus_fields: DirectusFields[];
  directus_files: DirectusFiles[];
  directus_flows: DirectusFlows[];
  directus_folders: DirectusFolders[];
  directus_migrations: DirectusMigrations[];
  directus_notifications: DirectusNotifications[];
  directus_operations: DirectusOperations[];
  directus_panels: DirectusPanels[];
  directus_permissions: DirectusPermissions[];
  directus_policies: DirectusPolicies[];
  directus_presets: DirectusPresets[];
  directus_relations: DirectusRelations[];
  directus_revisions: DirectusRevisions[];
  directus_roles: DirectusRoles[];
  directus_sessions: DirectusSessions[];
  directus_settings: DirectusSettings;
  directus_shares: DirectusShares[];
  directus_translations: DirectusTranslations[];
  directus_users: DirectusUsers[];
  directus_versions: DirectusVersions[];
  directus_webhooks: DirectusWebhooks[];
  event_attachments: EventAttachments[];
  event_audiences: EventAudiences[];
  event_locations: EventLocations[];
  event_organizers: EventOrganizers[];
  event_tags: EventTags[];
  events_audiences: EventsAudiences[];
  events_tags: EventsTags[];
  global: Global;
  hymn: Hymn[];
  hymn_authors: HymnAuthors[];
  hymn_authors_author_roles: HymnAuthorsAuthorRoles[];
  hymn_categories: HymnCategories[];
  hymn_files: HymnFiles[];
  hymn_hymn_categories: HymnHymnCategories[];
  hymn_hymnal_versions: HymnHymnalVersions[];
  hymnals: Hymnals[];
  program_activities: ProgramActivities[];
  programs: Programs[];
  programs_hymn: ProgramsHymn[];
  programs_program_activities: ProgramsProgramActivities[];
  task_type: TaskType[];
  tasks: Tasks[];
};
