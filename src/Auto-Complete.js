(function() {


  //todo: #1 选中数据作为一个方法, 里面包含发射事件


  //判断:当前元素是否是被筛选元素的子元素或者本身 
  jQuery.fn.isChildAndSelfOf = function(b){
    return (this.closest(b).length > 0); 
  };


  // 内置过滤器
  var filter = {
    // 模糊匹配
    somevalue: function(value, data, ignoreCase) {
      var patten = new RegExp(value, ignoreCase ? 'i' : '');
      var result = data.filter(function(item, i) {
        return patten.test(item.label);
      });
      return result;
    },
    // 全字匹配
    fullword: function(value, data, ignoreCase) {
      var patten = new RegExp('^' + value + '$', ignoreCase ? 'i' : '');
      var result = data.filter(function(item, i) {
        return patten.test(item.label);
      });
      return result;
    }
  };

  // 工具函数
  var utils = {
    // 字符串模板替换
    tpl: function(tpls, data) {
      return tpls.replace(/{{(.*?)}}/g, function($1, $2) {
        return data[$2] === undefined ? $1 : data[$2];
      });
    },
    // 字符串模板替换, 属性替换, 比如disabled属性, true就添加,false就移除
    tplForAttr: function(tpls, data) {
      return tpls.replace(/{{(.*?)}}/g, function($1, $2) {
        return data[$2] ? $1.replace(/({{)|(}})/g, '') : '';
      });
    },
    // 是否为数组
    isArray: function(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    },
    // 是否为函数
    isFunction: function(fn) {
      return Object.prototype.toString.call(fn) === '[object Function]';
    },
    // 去除首尾空格
    trim: function(str) {
      return str.replace(/(^\s*)|(\s*$)/g, '') || '';
    },
    // 获取元素文档位置
    offset: function(ele) {
      var p = ele.offset();
      return {
        top: p.top + ele.outerHeight(),
        left: p.left
      };
    },
    // 数据规范化, 将dataSource数据源返回的数据规范化
    normalized: function(data) {
      // 参数检查
      if (!utils.isArray(data) || data.length == 0)
        return [];

      var result = [];

      for (var i = 0; i < data.length; ++i) {
        var item = data[i];
        // 数据项是对象还是单个值
        var single = item.label === undefined;
        var label = single ? item : (item.label || '');
        var norm = {
          label: label,
          value: item.value || label
        };
        result.push($.extend({}, item, norm));
      }

      return result;
    }
  };


  var AutoComplete = function(input, opt) {
    var options = {
      // 数据源
      dataSource: [],
      // 插入位置
      appendTo: null,
      // 敲击延迟, 对于本地数据推荐0延迟
      delay: 0,
      // 是否禁用
      disabled: false,
      // 最小长度, 比如匹配银行卡号, 输入11位数时才进行请求
      minLength: 0,
      // 过滤函数, 内置无过滤, 模糊匹配, 全字匹配, 默认的过滤器都支持是否大小写参数
      filter: filter.somevalue,
      // 是否清除前后空格
      istrim: true,
      // 是否忽略大小写
      ignoreCase: true,
      // 是否空白匹配所有
      allowEmpy: false,
      // item选项模板
      tmp: '<li index="{{index}}" title="{{label}}" value="{{value}}">{{label}}</li>' 
    };
    // 扩展参数
    this.options = $.extend({}, options, opt);
    this.ref = input;
    this.element = null;
    // 是否打开下拉列表
    this.ishow = false;
    // 当前搜寻到的数据
    this.data = null;
    // 初始化
    this.init();
  };

  AutoComplete.prototype.init = function() {
    var ref = this.ref;
    if (ref[0].autoComplete)
      ref[0].autoComplete.destroy();
    // 禁用原生自动填充
    ref.attr('autocomplete', 'off');
    ref.attr('data-visibility', 'hide');
    ref.attr('data-select', '');
    // 绑定事件
    this.bind();
    ref[0].autoComplete = this;
    AutoComplete.add(this);
  };
  AutoComplete.prototype.destroy = function() {
    this.hide();
    this.unbind();
    AutoComplete.remove(this);
  };
  AutoComplete.prototype.show = function() {
    var element = this.element;
    if (this.ishow || !element)
      return;

    this.ref.trigger(AutoComplete.Event.show, self);
    this.ref.attr('data-visibility', 'show');
    element.show(0);
    this.ishow = true;
  };
  AutoComplete.prototype.hide = function(trigger) {
    var element = this.element;
    if (!this.ishow )
      return;
    if (element)
      element.remove();

    if (!trigger)
      this.ref.trigger(AutoComplete.Event.hide, self);

    this.ref.attr('data-visibility', 'hide');
    this.element = null;
    this.ishow = false;
  };
  AutoComplete.prototype.bind = function() {
    var ref = this.ref;

    this.debounce_hander_input = _.debounce(this.hander_input, this.options.delay);
    ref.bind('input', this, this.debounce_hander_input);
    ref.bind('keydown', this, this.hander_keyup);
  };
  AutoComplete.prototype.unbind = function() {
    var ref = this.ref;
    ref.unbind('input', this.debounce_hander_input);
    ref.unbind('keyup', this.hander_keyup);
  };
  // 搜寻值,显示匹配下拉列表
  AutoComplete.prototype.search = function(value, _data) {
    var ref = this.ref;
    var options = this.options;
    var filter = options.filter;
    var options = this.options;
    // 过滤值
    var val = this.filter(value || ref.val());
    if (options.disabled || val.length < options.minLength || (!options.allowEmpy && val === '')) {
      // 销毁上一个存在的下拉列表
      this.hide();
      return;
    }

    // 获取数据
    var data = _data || this.get();
    // 过滤数据, 得到最终要显示的数据
    var d = filter(val, data, options.ignoreCase);

    // 创建下拉列表
    this.createList(d);
    // 显示下拉列表
    this.show();
  };
  // 值过滤器
  AutoComplete.prototype.filter = function(value) {
    var options = this.options;
    var val = value;

    // 去除首尾空格
    if (options.istrim) {
       val = utils.trim(val);
    }
    return val;
  };
  // 根据数据源获取数据
  AutoComplete.prototype.get = function() {
    var self = this;
    var dataSource = this.options.dataSource;
    // dataSource=数组
    if (utils.isArray(dataSource)) {
      return utils.normalized(dataSource);
    }
    // dataSource=函数
    if (utils.isFunction(dataSource)) {
      dataSource(self.ref.val(), this, function(asyndata, raw) {
        // asyndata=通过数据源返回的数据, raw当初查询的依据值
        // 如果 当初查询值:异步返回结果 不匹配 当前输入框的值, 则抛弃这个数据,
        if (self.filter(self.ref.val()) === raw) {
          self.search(raw, utils.normalized(asyndata));
        }
      });
      return [];
    }
    console.warn('AutoComplete.options.dataSource 不是一个合法数据源类型!');
    return [];
  };
  // 选中一个下拉列表
  AutoComplete.prototype.select = function(index) {
    var data = this.data;
    var ref = this.ref;
    if (!utils.isArray(data) || data.length === 0)
      return;

    if (index < 0 || index >= data.length) {
      console.warn('AutoComplete.select 选择失败, 索引越界:', index, data);
      return;
    }

    // 当前选中数据
    var current = data[index];
    // 将值填入
    ref.val(current.label);
    autocomplete.ref.attr('data-select', current.label);
    // 发射事件
    ref.trigger(AutoComplete.Event.select, current, self);
    this.hide(true);
    this.data = null;

  };
  // 创建下拉列表
  AutoComplete.prototype.createList = function(data) {
    if (data.length <= 0)
      return;

    
    var self = this;
    var options = this.options;
    var ref = this.ref;
    var element = $('<div class="AutoComplete-wrap"></div>').hide().data('index', -1).data('data', data);
    var ul = $('<ul></ul>');
    var lis = $();
    self.data = data;

    for (var i = 0; i < data.length; ++i) {
      var item = data[i];
      var li = $(utils.tpl(options.tmp, $.extend({}, {index: i}, item)));
      // 绑定附加数据
      li.data('attached', item);
      li.data('index', i);
      ul.append(li);
      lis = lis.add(li);
    }
    element.append(ul);

    // 插入或替换下拉列表
    if (options.appendTo === null) {
      self.append(element, ref, self.ishow);
    } else {
      if (self.ishow) {
        options.appendTo.replaceWith(element);
      } else {
        options.appendTo.append(element);
      }
    }

    // 绑定选择事件
    lis.click(function() { self.select($(this).data('index'));});
    this.element = element;
  };
  // 默认插入下拉列表
  AutoComplete.prototype.append = function(element, ref, isReplace) {
    // 计算剩余高度
    var availableHeight = ($(window).height() + $(window).scrollTop()) - (ref.offset().top + ref.outerHeight());
    var pos = utils.offset(ref);
    element.css({
      display: 'block',
      position: 'absolute',
      top: pos.top,
      left: pos.left,
      'max-height': availableHeight,
      'width': ref.outerWidth(),
      'overflow-y': 'auto',
      'overflow-x': 'hidden'
    });

    if (isReplace) {
      this.element.replaceWith(element);
    } else {
      $(document.body).append(element);
    }
  };
  // 事件控制-input
  AutoComplete.prototype.hander_input = function(event) {
    var autocomplete = event.data;
    var val = $(this).val();
    autocomplete.ref.attr('data-select', '');
    autocomplete.search(val);
    
  }
  // 事件控制-keyup
  AutoComplete.prototype.hander_keyup = function(event) {
    var autocomplete = event.data;
    if (!autocomplete.ishow)
      return;
    var index = autocomplete.element.data('index');
    var data = autocomplete.element.data('data');
    var li = $('ul', autocomplete.element).children();
    
    function jump(i) {
      // 检测越界
      if (i < 0 || i >= data.length)
        return;

      // todo: 被激活元素需要定位, 移动父元素滚动条
      li.eq(i).addClass('active').siblings().removeClass('active');
      li.eq(i)[0].scrollIntoView(false);
      autocomplete.element.data('index', i);
      event.stopPropagation();
    }

    var key = event.keyCode;
    switch (key) {
      case 38:
        jump(index - 1);
      break;
      case 40:
        jump(index + 1);
      break;
      case 13:
        autocomplete.select(index);
        event.stopPropagation();
        return false;
      default:
        break;
    }
  }

  // 静态
  AutoComplete.autocompletes = [];
  // 选择事件
  AutoComplete.Event = {
    'select': 'SELECT',
    'show': 'SHOW',
    'hide': 'HIDE'
  };
  AutoComplete.add = function(autocomplete) {
    AutoComplete.autocompletes.push(autocomplete);
  };
  AutoComplete.remove = function(autocomplete) {
    var index = -1;
    $.each(AutoComplete.autocompletes, function(i) {
      if (this === autocomplete)
        index = i;
    });
    if (index !== -1)
      AutoComplete.autocompletes.splice(index, 1);
  };
  AutoComplete.hander_click = function(event) {
    var target = $(event.target);
    $.each(AutoComplete.autocompletes, function() {
      if (!target.isChildAndSelfOf(this.ref) && !target.isChildAndSelfOf(this.element)) {
        this.hide();
      }
    });
  };

  // 空白出点击
  $(document.body).click(AutoComplete.hander_click);
  window.AutoComplete = AutoComplete;
})();