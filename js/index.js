(function () {
  // 一些工具方法 ==================================================
  var Util = (function () {
    var prefix = 'html5_reader_';
    var StorageGetter = function (key) {
      return localStorage.getItem(prefix + key);
    };
    var StorageSetter = function (key, val) {
      return localStorage.setItem(prefix + key, val);
    };
    var getJSONP = function (url, callback) {
      return $.jsonp({
        url: url,
        cache: true,
        callback: 'duokan_fiction_chapter',
        success: function (result) {
          var data = $.base64.decode(result);
          var json = decodeURIComponent(escape(data));
          callback(json);
        }
      })
    };
    return {
      getJSONP: getJSONP,
      StorageGetter: StorageGetter,
      StorageSetter: StorageSetter
    }
  })();

  // 一些全局变量 =============================================================
  var Dom = {
    top_nav: $('#top_nav'),
    bottom_nav: $('#bottom_nav'),
    font_container: $('#font-container'),
    font_button: $('#font-button'),
    fiction_container: $('#fiction_container')
  };
  var Win = $(window);
  var Doc = $(document);
  var readerModel;
  var readerBaseFrame;


  var initFontSize = parseInt(Util.StorageGetter('font-size')) || 16;
  // initFontSize = parseInt(initFontSize);
  // if (!initFontSize) {
  //   initFontSize = 16;
  // }
  Dom.fiction_container.css('font-size', initFontSize);

  // 入口函数 =========================================================
  function main() {
    readerModel = ReaderModel();
    readerBaseFrame = ReaderBaseFrame(Dom.fiction_container);
    readerModel.init(function (data) {
      readerBaseFrame(data)
    });
    EventHandle();
  }

  // 数据相关 =============================================================
  function ReaderModel() {
    var chapter_id;
    var chapterTotal;
    var init = function (UICallback) {
      getFictionInfo(function () {
        getCurChapterContent(chapter_id, function (data) {
          UICallback && UICallback(data)
        })
      })
    };
    // 获取章节信息
    var getFictionInfo = function (callback) {
      $.get('data/chapter.json', function (data) {
        chapter_id = Util.StorageGetter('last_chapter_id') || data.chapters[1].chapter_id;
        chapterTotal = data.chapters.length;
        callback && callback();
      }, 'json')
    };
    // 获取章节内容：根据章节信息
    var getCurChapterContent = function (chapter_id, callback) {
      $.get('data/data' + chapter_id + '.json', function (data) {
        if (data.result === 0) {
          var url = data.jsonp;
          // 根据 url 跨域获取数据： http://html.read.duokan.com
          Util.getJSONP(url, function (data) {
            callback && callback(data);
          })
        }
      }, 'json')
    };
    var prevChapter = function (UICallback) {
      chapter_id = parseInt(chapter_id, 10);
      if (chapter_id === 0) return;
      chapter_id -= 1;
      getCurChapterContent(chapter_id, UICallback);
      Util.StorageSetter('last_chapter_id', chapter_id);
    };
    var nextChapter = function (UICallback) {
      chapter_id = parseInt(chapter_id, 10);
      if (chapter_id === chapterTotal) return;
      chapter_id += 1;
      getCurChapterContent(chapter_id, UICallback);
      Util.StorageSetter('last_chapter_id', chapter_id);
    };
    return {
      init: init,
      prevChapter: prevChapter,
      nextChapter: nextChapter
    }
  }

  // 页面数据交互DOM相关 =========================================
  function ReaderBaseFrame(container) {
    function parseChapterData(jsonData) {
      var jsonObj = JSON.parse(jsonData);
      var html = '<h4>' + jsonObj.t + '</h4>';
      for (var i = 0; i < jsonObj.p.length; i++) {
        html += '<p>' + jsonObj.p[i] + '</p>'
      }
      return html;
    }
    return function (data) {
      container.html(parseChapterData(data));
    }
  }

  // 事件相关（前端页面交互）==================================================
  function EventHandle() {
    $("#action-mid").click(function () {
      if (Dom.top_nav.css('display') === 'none') {
        Dom.top_nav.show();
        Dom.bottom_nav.show();
      }
      else {
        Dom.top_nav.hide();
        Dom.bottom_nav.hide();
        Dom.font_container.hide();
      }
    }, false);

    Dom.font_button.click(function () {
      if (Dom.font_container.css('display') === 'none') {
        Dom.font_container.show();
        Dom.font_button.addClass('current');
      }
      else {
        Dom.font_container.hide();
        Dom.font_button.removeClass('current');
      }
    });

    $('#large-button').click(function () {
      if (initFontSize >= 20) return;
      initFontSize += 1;
      Dom.fiction_container.css('font-size', initFontSize);
      Util.StorageSetter('font-size', initFontSize)
    });
    $('#small-button').click(function () {
      if (initFontSize <= 16) return;
      initFontSize -= 1;
      Dom.fiction_container.css('font-size', initFontSize);
      Util.StorageSetter('font-size', initFontSize);
    });

    // 滚动的时候隐藏上下条
    Win.scroll(function () {
      Dom.top_nav.hide();
      Dom.bottom_nav.hide();
      Dom.font_container.hide();
    })

    $('#prev_button').click(function () {
      readerModel.prevChapter(function (data) {
        readerBaseFrame(data)
      })
    });
    $('#next_button').click(function () {
      readerModel.nextChapter(function (data) {
        readerBaseFrame(data)
      })
    });

  }

  main();

})();