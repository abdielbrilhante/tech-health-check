document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  const topics = document.querySelectorAll('.topic');

  for (const [i, topic] of topics.entries()) {
    const options = topic.querySelectorAll('input[type="radio"]');
    for (const option of options) {
      option.addEventListener('change', () => {
        const selected = Object.fromEntries(new FormData(form));
        if (selected[`state_${i}`] && selected[`trend_${i}`]) {
          topic.classList.add('answered');
        }
      });
    }
  }
});
