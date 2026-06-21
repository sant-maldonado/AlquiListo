ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_type_check
  CHECK (type IN ('dni', 'dni_front', 'dni_back', 'recibo_sueldo', 'escritura', 'poliza_caucion', 'contrato_anterior', 'otro'));
