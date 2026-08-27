DELETE FROM `events`
WHERE `id` = 'event-1787527220570';
--> statement-breakpoint
DELETE FROM `activity_events`
WHERE `kind` = 'introduction_requested'
  AND `member_id` = 'profile-tbc-ncNB1rRGh9Kv4dovrWWpOZDeWqvJ5Fgu43ikRX9I07AcATRDYX12nf';
--> statement-breakpoint
DELETE FROM `member_actions`
WHERE `kind` = 'introduction_requested'
  AND `member_id` = 'profile-tbc-ncNB1rRGh9Kv4dovrWWpOZDeWqvJ5Fgu43ikRX9I07AcATRDYX12nf';
--> statement-breakpoint
UPDATE `members`
SET `completion` = (
  (CASE WHEN trim(`name`) <> '' THEN 1 ELSE 0 END) +
  (CASE WHEN trim(`email`) <> '' THEN 1 ELSE 0 END) +
  (CASE WHEN trim(`phone`) <> '' THEN 1 ELSE 0 END) +
  (CASE WHEN trim(`title`) <> '' THEN 1 ELSE 0 END) +
  (CASE WHEN trim(`company`) <> '' THEN 1 ELSE 0 END) +
  (CASE WHEN trim(`industry`) <> '' THEN 1 ELSE 0 END) +
  (CASE WHEN trim(`bio`) <> '' THEN 1 ELSE 0 END) +
  (CASE WHEN trim(`looking_for`) <> '' THEN 1 ELSE 0 END) +
  (CASE WHEN trim(`can_help`) <> '' THEN 1 ELSE 0 END) +
  (CASE WHEN trim(`interests`) <> '' THEN 1 ELSE 0 END)
) * 10;
