# Translation Contribution Guide

Thank you for your interest in contributing translations to the Learning Platform! This guide will help you get started with translating the platform into your language.

## Getting Started

### Prerequisites
- Basic understanding of JSON file format
- Familiarity with the language you want to translate to
- A text editor or IDE (VS Code recommended)

### Translation Files
Translation files are located in the `public/translations/` directory. Each language has its own CSV file:
- `nl.csv` - Dutch (reference language)
- `en.csv` - English
- `fr.csv` - French
- `de.csv` - German
- `es.csv` - Spanish
- `tr.csv` - Turkish

## Translation Process

### 1. Choose a Language
Select a language from the list above. If your language is not listed, please create a new file following the naming convention: `{language_code}.csv`

### 2. Translation File Format
Each CSV file follows this format:
```csv
key,translation
study_title,Studeren
study_learn,Leren
study_test,Test
```

### 3. Translation Guidelines

#### Best Practices
- **Keep it concise**: Translations should be similar in length to the original
- **Use natural language**: Avoid word-for-word translations
- **Maintain context**: Consider where the text will be used
- **Test your translations**: Preview the platform to see how they look

#### Common Patterns
- **Buttons**: Use imperative verbs (e.g., "Save", "Cancel")
- **Labels**: Use nouns (e.g., "Username", "Password")
- **Messages**: Use complete sentences with proper punctuation
- **Placeholders**: Keep `{variable}` placeholders intact

#### Special Characters
- **Ampersands**: Use `&amp;` instead of `&`
- **Quotes**: Use `&quot;` instead of `"`
- **Less than**: Use `&lt;` instead of `<`
- **Greater than**: Use `&gt;` instead of `>`

### 4. Adding New Translations

If you need to add a new translation key:
1. Add the key to `nl.csv` (Dutch reference)
2. Add the same key to all other language files
3. Provide translations for each language

Example:
```csv
# nl.csv
new_feature_key,Nieuwe functie

# en.csv
new_feature_key,New feature

# fr.csv
new_feature_key,Nouvelle fonctionnalité
```

### 5. Review and Submit

Before submitting your translations:
- Check for spelling and grammar
- Ensure all keys from the reference file are translated
- Test the translations in the platform
- Verify that the UI displays correctly

## Translation Coverage

Use the Translation Coverage Checker in the platform to:
- View overall translation coverage per language
- Identify missing translation keys
- Export coverage reports

## Contributing

### Submitting Translations
1. Fork the repository
2. Create a new branch for your translations
3. Add or update translation files
4. Submit a pull request with a description of your changes

### Pull Request Template
```
## Translation Update

- Language: [language code]
- Coverage: [percentage]
- Changes: [description of changes]
- Testing: [how you tested the translations]
```

## Support

If you need help:
- Check existing translation files for examples
- Review the Translation Coverage Checker for missing keys
- Open an issue on GitHub for questions

## Language-Specific Notes

### Dutch (nl)
- Reference language
- All other languages should match this structure

### English (en)
- Use US English spelling
- Avoid British English variants

### French (fr)
- Use formal language (vous instead of tu)
- Follow standard French grammar rules

### German (de)
- Use formal language (Sie instead of du)
- Follow standard German grammar rules
- Use proper capitalization for nouns

### Spanish (es)
- Use neutral Spanish (avoid regional dialects)
- Follow standard Spanish grammar rules

### Turkish (tr)
- Follow standard Turkish grammar rules
- Use formal language where appropriate

## Recognition

Contributors will be credited in the platform's acknowledgments section. Your help in making the Learning Platform accessible to more users is greatly appreciated!

## Resources

- [Translation Coverage Checker](/translations/coverage)
- [Platform Documentation](/docs)
- [GitHub Repository](https://github.com/your-repo)
