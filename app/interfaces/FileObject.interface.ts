export interface FieldObject {
  collection: string;
  field:      string;
  type:       string;
  meta:       Meta;
  schema:     Schema;
}

export interface Meta {
  id:                 number;
  collection:         string;
  field:              string;
  special:            null;
  interface:          string;
  options:            Options;
  display:            string;
  display_options:    DisplayOptions;
  readonly:           boolean;
  hidden:             boolean;
  sort:               number;
  width:              string;
  translations:       null;
  note:               null;
  conditions:         null;
  required:           boolean;
  group:              null;
  validation:         null;
  validation_message: null;
}

export interface DisplayOptions {
  format:                boolean;
  conditionalFormatting: ConditionalFormatting[];
}

export interface ConditionalFormatting {
  operator: string;
  value:    string;
  text:     string;
}

export interface ConditionalFormattingFiltered {
  id:    string;
  key: string;
  text?: string;
}

export interface Options {
  choices: Choice[];
}

export interface Choice {
  text:  string;
  value: string;
}

export interface Schema {
  name:                  string;
  table:                 string;
  schema:                string;
  data_type:             string;
  is_nullable:           boolean;
  generation_expression: null;
  default_value:         string;
  is_generated:          boolean;
  max_length:            number;
  comment:               null;
  numeric_precision:     null;
  numeric_scale:         null;
  is_unique:             boolean;
  is_primary_key:        boolean;
  has_auto_increment:    boolean;
  foreign_key_schema:    null;
  foreign_key_table:     null;
  foreign_key_column:    null;
}
