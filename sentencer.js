(function(window, document) {

  var textStore = (function() {
    var store_ = {
      articles: [],
      adjectives: [],
      nouns: [],
      verbs: [],
      objs: [],
    };

    var pickOne_ = function(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    };

    var pick_ = function() {
      return {
        article: pickOne_(store_.articles),
        adjective: pickOne_(store_.adjectives),
        noun: pickOne_(store_.nouns),
        verb: pickOne_(store_.verbs),
        obj: pickOne_(store_.objs)
      };
    };

    var load_ = function() {
      var keys = ['articles', 'adjectives', 'nouns', 'verbs', 'objs'];
      for (var i = 0; i < keys.length; i++) {
        store_[keys[i]] = window.sentencerData[keys[i]].slice(0);
      }
    };

    return {
      load: load_,
      pick: pick_
    };
  })();

  var languageModel = (function() {

    var vowels_ = /^[aeiou].*/;

    var adjustArticle_ = function(candidate) {
      var startVowel = vowels_.test(candidate.adjective);
      if (candidate.article == 'a') {
        if (startVowel) {
          candidate.article = 'an';
        }
      } else if (candidate.article == 'an') {
        if (!startVowel) {
          candidate.article = 'a';
        }
      }
    };

    var adjust_ = function(candidate) {
      adjustArticle_(candidate);
      return candidate;
    };

    return {
      adjust: adjust_
    };
  })();

  var tailor = (function() {
    var spanify_ = function(text, paletteNum) {
      var span = document.createElement('span');
      span.className = "word palette" + paletteNum;
      span.innerHTML = text + "<div></div>";
      return span;
    };

    var render_ = function(candidate) {
      var palette = Math.floor(Math.random() * 5) + 1;
      var order = ['article', 'adjective', 'noun', 'verb', 'obj'];
      var rendering = {};
      for (var i = 0; i < order.length; i++) {
        rendering[order[i]] = spanify_(candidate[order[i]], palette);
      }
      return rendering;
    };

    return {
      render: render_
    };
  })();

  var animator = (function() {

    var curRendering_;
    var curSentence_;
    var container_;

    var init_ = function(container) {
      container_ = container;
    };

    var fadeOutSingle_ = function(el) {
      el.style.webkitTransition = 
        "top " +
        "0.5s " +
        "cubic-bezier(.10, .10, .25, .90) " +
        (Math.random() * 0.8) + 's';
      el.style.top = (window.innerHeight / 2 + el.offsetHeight * 2) + "px";
    };

    var fadeInSingle_ = function(el) {
      el.style.webkitTransition = 
        "top " +
        "0.5s " +
        "cubic-bezier(.10, .10, .25, .90) " +
        (Math.random() * 0.8 + 0.3) + 's';
      el.style.top = "0px";      
    };

    var fadeOut_ = function() {
      for (var k in curRendering_) {
        fadeOutSingle_(curRendering_[k]);
      }
      (function(curSentence_) {
        window.setTimeout(function() {
          curSentence_.parentNode.removeChild(curSentence_);
        }, 2000);
      })(curSentence_);
    };

    var fadeIn_ = function() {
      var sentence = document.createElement('p');
      sentence.className = 'rendering';      
      container_.appendChild(sentence);
      var order = ['article', 'adjective', 'noun', 'verb', 'obj'];
      for (var i = 0; i < order.length; i++) {
        var el = curRendering_[order[i]];
        el.style.top = -(window.innerHeight / 2 + el.offsetHeight * 2) + "px";
        sentence.appendChild(el);
        (function(el) {
          window.setTimeout(function() {
            fadeInSingle_(el);
          }, 0);
        })(el);
      }
      return sentence;
    };

    var transitionTo_ = function(rendering) {
      if (!!curSentence_) {
        fadeOut_();
      }
      curRendering_ = rendering;
      curSentence_ = fadeIn_();
    };

    return {
      init: init_,
      transitionTo: transitionTo_
    }
  })();

  var background = (function(textStore, tailor) {
    var container_;

    var displaceSingle_ = function(el) {
      el.style.top = (window.innerHeight + Math.floor(Math.random() * window.innerHeight)) + "px";
      el.style.left = Math.floor(Math.random() * window.innerWidth) + "px";
    }

    var displace_ = function(rendering) {
      var order = ['article', 'adjective', 'noun', 'verb', 'obj'];
      for (var i = 0; i < order.length; i++) {
        var el = rendering[order[i]];
        el.className = el.className + " background";
        displaceSingle_(el);
        container_.appendChild(el);

        (function(el) {
          window.setTimeout(function() {
            el.style.webkitTransition = 
              "top " +
              (40 + Math.random() * 15) + "s " +
              "linear";
            el.style.top = "-200px";
          }, 0);
        })(el);

        (function(el) {
          window.setTimeout(function() {
            el.parentNode.removeChild(el);
          }, 80000);
        })(el);
      }
    };

    var generate_ = function() {
      var candidate = textStore.pick();
      var rendering = tailor.render(candidate);
      displace_(rendering);
    };

    var init_ = function(container) {
      container_ = container;
      window.setInterval(generate_, 1000);
    };

    return {
      init: init_
    };
  })(textStore, tailor);

  var glue = (function(textStore, languageModel, tailor, animator) {
    return {
      onTrigger: function(evt) {
        if (!!evt) { evt.preventDefault(); }
        var candidate = textStore.pick();
        languageModel.adjust(candidate);
        var rendering = tailor.render(candidate);
        animator.transitionTo(rendering);
      },
      onFullscreen: function(evt) {
        if (container.requestFullScreen) {
          container.requestFullScreen();
        } else if (container.mozRequestFullScreen) {
          container.mozRequestFullScreen();
        } else if (container.webkitRequestFullScreen) {
          container.webkitRequestFullScreen();
        }
      }
    }
  })(textStore, languageModel, tailor, animator);

  window.sentencer = {
    boot: function(container, trigger, fscreen, options) {
      textStore.load();
      animator.init(container);
      trigger.addEventListener('click', glue.onTrigger, false); 
      fscreen.addEventListener('click', glue.onFullscreen, false); 

      if (!!options.animatedBackground) {
        background.init(container);
      }
      if (!!options.autoGenerateEverySecs && options.autoGenerateEverySecs > 0) {
        glue.onTrigger(null);
        window.setInterval(function() {
          glue.onTrigger(null);
        }, options.autoGenerateEverySecs * 1000);
      }
    }
  };
})(window, document);