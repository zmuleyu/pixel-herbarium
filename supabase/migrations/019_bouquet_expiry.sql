-- Migration 019: Enforce 7-day bouquet expiry on the server side.
-- Prevents accepting or declining a pending bouquet after it has expired.

DROP POLICY IF EXISTS bouquets_update ON bouquets;

CREATE POLICY bouquets_update ON bouquets FOR UPDATE
  USING (
    receiver_id = auth.uid()
    AND (status != 'pending' OR expires_at > now())
  );
