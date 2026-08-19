-- Add subject_id field to study_sets to integrate Leersets with Vakken
-- This allows study sets to be linked to specific subjects for better organization

-- Check if column already exists before adding
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'study_sets' 
        AND column_name = 'subject_id'
    ) THEN
        ALTER TABLE study_sets 
        ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
        
        -- Add index for faster queries
        CREATE INDEX idx_study_sets_subject_id ON study_sets(subject_id);
        
        -- Add comment
        COMMENT ON COLUMN study_sets.subject_id IS 'Optional link to a subject for organizing leersets within the vakken structure';
    END IF;
END $$;
