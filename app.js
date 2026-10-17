(() => {
  const summaryElement = document.querySelector('#about-summary');
  const summaryParagraphs = [
    {
      emphasis: 'Spring Core',
      text: " is the foundation of the Spring Framework. Its Inversion of Control (IoC) container creates and manages application objects called beans. With Dependency Injection (DI), Spring supplies a bean's collaborators instead of requiring the bean to construct them itself. This loose coupling makes components easier to test, configure, and reuse."
    },
    {
      emphasis: 'Hibernate',
      text: ' is an Object-Relational Mapping (ORM) framework for Java. It maps Java classes and objects to relational database tables and rows, reducing repetitive SQL and data-access code. Through entities, sessions, and transactions, Hibernate helps applications persist and retrieve data while keeping domain logic focused.'
    },
    {
      emphasis: '',
      text: 'Together, Spring can wire services and repositories through dependency injection, while Hibernate handles persistence. The result is a modular application with clearer boundaries between object creation, business logic, and database operations.'
    }
  ];
  const summaryText = summaryParagraphs.map(({ emphasis, text }) => `${emphasis}${text}`).join(' ');
  const storageKey = 'core-notes-response';

  if (summaryElement) {
    summaryParagraphs.forEach(({ emphasis, text }) => {
      const paragraph = document.createElement('p');
      if (emphasis) {
        const label = document.createElement('strong');
        label.textContent = emphasis;
        paragraph.append(label);
      }
      paragraph.append(document.createTextNode(text));
      summaryElement.append(paragraph);
    });
  }

  // Normalize words consistently so punctuation and letter case do not affect a match.
  const getWords = (text) => text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const summaryWords = new Set(getWords(summaryText));

  const scoreResponse = (text) => {
    const words = getWords(text);
    const matched = words.filter((word) => summaryWords.has(word)).length;
    const percent = words.length ? Number(((matched / words.length) * 100).toFixed(2)) : 0;
    return { total: words.length, matched, percent };
  };

  const formatPercent = (percent) => String(percent.toFixed(2)).replace(/\.?0+$/, '');

  const form = document.querySelector('#knowledge-form');
  if (form) {
    const nameInput = document.querySelector('#name');
    const emailInput = document.querySelector('#email');
    const keywordsInput = document.querySelector('#keywords');
    const wordCount = document.querySelector('#word-count');
    const formStatus = document.querySelector('#form-status');
    const previewPercent = document.querySelector('#preview-percent');
    const previewCount = document.querySelector('#preview-count');

    // Keep name input letters-only while retaining native keyboard and paste support.
    nameInput.addEventListener('input', () => {
      nameInput.value = Array.from(nameInput.value).filter((character) => /\p{L}/u.test(character)).join('').slice(0, 10);
      clearError(nameInput);
    });

    emailInput.addEventListener('input', () => clearError(emailInput));

    const updatePreview = () => {
      const words = getWords(keywordsInput.value);
      const result = scoreResponse(keywordsInput.value);
      wordCount.textContent = `${words.length} / 100 words`;
      wordCount.classList.toggle('over-limit', words.length > 100);
      previewPercent.innerHTML = `${formatPercent(result.percent)}<span>%</span>`;
      previewCount.textContent = `${result.matched} ${result.matched === 1 ? 'word' : 'words'} matched`;
      clearError(keywordsInput);
      formStatus.textContent = words.length > 100 ? 'Please shorten your response to 100 words or fewer.' : '';
    };

    keywordsInput.addEventListener('input', updatePreview);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      formStatus.textContent = '';

      const validName = /^\p{L}{1,10}$/u.test(nameInput.value);
      const validEmail = emailInput.value.length <= 20 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
      const words = getWords(keywordsInput.value);
      const validKeywords = words.length > 0 && words.length <= 100;

      setError(nameInput, validName ? '' : 'Use 1–10 letters only.');
      setError(emailInput, validEmail ? '' : 'Enter a valid email address (up to 20 characters).');
      setError(keywordsInput, validKeywords ? '' : words.length > 100 ? 'Please use 100 words or fewer.' : 'Enter at least one keyword or concept.');

      if (!validName || !validEmail || !validKeywords) {
        formStatus.textContent = 'Please check the highlighted fields.';
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }

      const result = scoreResponse(keywordsInput.value);
      const response = { name: nameInput.value, email: emailInput.value, keywords: keywordsInput.value, ...result };

      try {
        sessionStorage.setItem(storageKey, JSON.stringify(response));
      } catch {
        formStatus.textContent = 'Could not save this response in the browser. Please check your privacy settings and try again.';
        return;
      }

      window.location.href = 'verify.html';
    });
  }

  const resultsPage = document.querySelector('[data-page="verify"]');
  if (resultsPage) {
    let response = null;
    try {
      response = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
    } catch {
      response = null;
    }

    if (!response || typeof response.name !== 'string' || typeof response.email !== 'string') {
      document.querySelector('#empty-result').hidden = false;
      document.querySelector('.results-layout').hidden = true;
      document.querySelector('.result-nav').hidden = true;
    } else {
      const score = scoreResponse(response.keywords ?? '');
      document.querySelector('#result-name').textContent = response.name;
      document.querySelector('#result-email').textContent = response.email;
      document.querySelector('#result-total').textContent = String(score.total);
      document.querySelector('#result-count').textContent = `${score.matched} of ${score.total} ${score.total === 1 ? 'word' : 'words'} matched`;
      document.querySelector('#result-percent').textContent = `${formatPercent(score.percent)}%`;
      document.querySelector('#progress-fill').style.width = `${score.percent}%`;
      document.querySelector('#result-progress').setAttribute('aria-valuenow', String(score.percent));
    }
  }

  function setError(input, message) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    document.querySelector(`#${input.id}-error`).textContent = message;
  }

  function clearError(input) {
    if (input.getAttribute('aria-invalid') === 'true') setError(input, '');
  }
})();