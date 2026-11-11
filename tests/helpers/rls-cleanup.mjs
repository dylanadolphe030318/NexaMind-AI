export async function runWithRlsCleanup({
  action,
  cleanup = [],
  disconnect = [],
}) {
  const errors = [];
  let result;

  try {
    result = await action();
  } catch (error) {
    errors.push(error);
  }

  for (const operation of cleanup) {
    try {
      await operation();
    } catch (error) {
      errors.push(error);
    }
  }

  for (const operation of disconnect) {
    try {
      await operation();
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length === 1) {
    throw errors[0];
  }
  if (errors.length > 1) {
    throw new AggregateError(
      errors,
      "L'opération RLS et/ou son nettoyage ont échoué.",
    );
  }

  return result;
}
