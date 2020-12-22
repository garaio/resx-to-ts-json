import program = require('./index');

program.executeResxToTs('testnamespace', '/Resources', '/Resources/_generated');
program.executeResxToJson('/Resources', '/Resources/_generated/');
program.executeResxToTsTranslationKeys('Reka.RekaNet.EmployerPortal.Web.VueResources.', '/Resources', '/Resources/_generated/keysOnly', /VueResources.resx$/);