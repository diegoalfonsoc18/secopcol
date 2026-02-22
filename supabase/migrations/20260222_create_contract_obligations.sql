-- Migration: Crear tabla contract_obligations
-- Calendario tributario del contrato: seguimiento de obligaciones post-adjudicacion

CREATE TABLE IF NOT EXISTS contract_obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  process_id TEXT NOT NULL,
  process_name TEXT,
  obligation_type TEXT NOT NULL
    CHECK (obligation_type IN ('estampilla', 'retencion', 'seguridad_social', 'informe')),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  estimated_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'overdue')),
  reminder_days INTEGER[] DEFAULT '{7,1}',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE contract_obligations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own obligations"
  ON contract_obligations FOR ALL
  USING (auth.uid() = user_id);

-- Indices
CREATE INDEX idx_obligations_user_due
  ON contract_obligations(user_id, due_date, status);

CREATE INDEX idx_obligations_process
  ON contract_obligations(user_id, process_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_obligation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_obligation_updated_at
  BEFORE UPDATE ON contract_obligations
  FOR EACH ROW
  EXECUTE FUNCTION update_obligation_updated_at();
