module.exports = {
  prompt: async ({ inquirer }) => {
    const { raw } = await inquirer.prompt([
      {
        type: 'input',
        name: 'raw',
        message: 'Feature Name (PascalCase, e.g. OwnerKpis):',
        validate: (v) => (!v || !v.trim() ? 'Please enter a name.' : true),
      },
    ]);

    // Strip junk like leading '#' , colons, extra spaces
    const cleaned = String(raw)
      .replace(/^#+\s*/g, '')   // remove markdown headings
      .replace(/[:]/g, '')      // remove colons
      .replace(/\s+/g, ' ')     // collapse spaces
      .trim();

    // Convert to PascalCase and param-case deterministically
    const toPascal = (s) =>
      s
        .replace(/[_\-\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        .replace(/^(.)/, (_, c) => c.toUpperCase())
        .replace(/[^A-Za-z0-9]/g, '');

    const toParam = (s) =>
      s
        .trim()
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[_\s]+/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase();

    const namePascal = toPascal(cleaned);
    const nameParam  = toParam(namePascal);

    // expose both to templates
    return { namePascal, nameParam };
  },
};