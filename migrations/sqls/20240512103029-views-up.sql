CREATE VIEW IF NOT EXISTS book_notes_vw 
AS
SELECT
	bn.*,
	u.fullname as user,
	b.name as book_name,
	b.author
FROM
	book_notes bn,
	users u,
	books b
WHERE
	bn.book_id = b.id
	AND bn.user_id = u.id;