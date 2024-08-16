export interface ProgramObject {
    id:                 string;
    status:             string;
    sort:               null;
    user_created:       string;
    date_created:       Date;
    user_updated:       string;
    date_updated:       Date;
    program_title:      string;
    start_datetime:     Date;
    program_activities: ProgramActivity[];
}

export interface ProgramActivity {
    id:                   string;
    status:               string;
    sort:                 null;
    user_created:         string;
    date_created:         Date;
    user_updated:         null | string;
    date_updated:         Date | null;
    activities:           string;
    activity_order:       number;
    activity_program:     string;
    activity_responsible: ActivityResponsible;
    activity_hymn:        ActivityHymn | null;
}

export interface ActivityHymn {
    id:                   string;
    status:               string;
    user_created:         string;
    date_created:         Date;
    user_updated:         string;
    date_updated:         Date;
    name:                 string;
    hymn_number:          number;
    hymnal:               string;
    letter_author:        null;
    trad_author:          null;
    music_author:         null;
    original_midi:        boolean;
    links_notes:          null;
    midi_file:            string;
    letter_hymn:          string;
    last_activity:        null;
    pro_file:             string;
    is_pro_file_exists:   boolean;
    track_only:           string;
    is_track_only_exists: boolean;
    are_lyrics_exists:    boolean;
    categories:           number[];
    hymnal_versions:      any[];
    files:                any[];
    hymn_programs:        string[];
}

export interface ActivityResponsible {
    id:           string;
    status:       string;
    sort:         null;
    user_created: string;
    date_created: Date;
    user_updated: string;
    date_updated: Date;
    first_name:   string;
    last_name:    string;
    avatar:       string;
    alias:        string;
}
