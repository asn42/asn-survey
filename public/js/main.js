(function () {
  function slowSubmit(formEl) {
    formEl.querySelector('input[type=submit]').addEventListener(
      'click',
      function (event) {
        var spinner = document.createElement('div');
        spinner.id = 'spinner';
        var spinnerImg = document.createElement('img');
        spinnerImg.src = '/img/spinner.svg';
        spinner.appendChild(spinnerImg);
        document.body.appendChild(spinner);
        setTimeout(function () { formEl.submit();}, 500);
        event.preventDefault();
      },
      false
    );
  }
  Array.from(document.forms).forEach(function (el) {
    slowSubmit(el);
  });
})();
