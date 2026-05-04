# Modele de Donnees

## User

- `id`
- `email`
- `name`
- `grade`
- `target_exam`
- `created_at`
- `subscription_plan`

## Subject

- `id`
- `name`
- `exam`

## Topic

- `id`
- `subject_id`
- `name`
- `parent_topic_id`

## Question

- `id`
- `subject_id`
- `topic_id`
- `difficulty`
- `type`
- `prompt`
- `choices`
- `correct_answer`
- `explanation`

## Diagnostic

- `id`
- `user_id`
- `subject_id`
- `started_at`
- `completed_at`
- `score`

## TestSession

- `id`
- `user_id`
- `subject_id`
- `mode`
- `started_at`
- `completed_at`
- `score`

## Answer

- `id`
- `user_id`
- `question_id`
- `test_session_id`
- `answer`
- `is_correct`
- `time_spent_seconds`

## Progress

- `id`
- `user_id`
- `topic_id`
- `mastery_percent`
- `confidence_score`
- `last_practiced_at`

## Achievement

- `id`
- `user_id`
- `type`
- `label`
- `unlocked_at`
