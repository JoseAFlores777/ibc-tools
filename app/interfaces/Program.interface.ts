export interface ProgramData {
  program_title:      string;
  start_datetime:     Date;
  bible_text:         string;
  bible_reference:    string;
  program_activities: ProgramActivity[];
}

export interface ProgramActivity {
  activity_order:       number;
  activities:           string;
  activity_hymn:        ActivityHymn | null;
  activity_responsible: ActivityResponsible;
  description:          string;
}

export interface ActivityHymn {
  name:                string;
  bible_text:          string;
  bible_reference:     string;
  hymn_number:         number;
  letter_hymn:         string;
  hymnal:              Hymnal;
  hymn_time_signature: string;
  authors:             Author[];
}

export interface Author {
  authors_id:   AuthorsID;
  author_roles: AuthorRole[];
}

export interface AuthorRole {
  author_roles_id: AuthorRolesID;
}

export interface AuthorRolesID {
  description: string;
  rol_abbr:    string;
}

export interface AuthorsID {
  name: string;
}

export interface Hymnal {
  name:      string;
  publisher: string;
}

export interface ActivityResponsible {
  last_name: string;
  avatar:    string;
  alias:     string;
}