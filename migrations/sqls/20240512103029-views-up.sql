CREATE VIEW IF NOT EXISTS book_notes_vw 
AS
SELECT
	bn.*,
	u.fullname AS user,
	b.name AS book_name,
	b.author,
	(
	SELECT
		COUNT(1)
	FROM
		comments c
	WHERE
		c.note_id = bn.id) AS comments,
	STRFTIME('%d',
	bn.modified_on) || ' ' || SUBSTR('JanFebMarAprMayJunJulAugSepOctNovDec',
	1 + 3 * STRFTIME('%m',
	bn.modified_on),
	-3) AS short_date
FROM
	book_notes bn,
	users u,
	books b
WHERE
	bn.book_id = b.id
	AND bn.user_id = u.id;