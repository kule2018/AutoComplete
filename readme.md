# AutoComplete

## 简介
> AutoComplete是一个input扩展, 帮助用户自动完成输入.

## todo
6. 增加一个标志, 用户手动更改元素后, 标志=false, 从下拉项中选择, 标志=true,
7. 在Input的 focus 事件也可以通过配置支持自动展开

## 特点
1. `dataSouce` 可以是异步函数
2. 使用节流函数, 并控制异步函数返回结果要与当初请求匹配的值相同
3. `filter` 过滤规则可以自行配置,, 比如全字匹配, 自定义正则匹配, 等 
4. 选中了某项后,给绑定的input元素触发一个自定义事件接收
5. 显示/关闭下拉列表后也发送一个事件
6. 增加一个标志, 用户手动更改元素后, 标志=false, 从下拉项中选择, 标志=true,
7. 在Input的 focus 事件也可以通过配置支持自动展开
8. 默认都是去除前后空格, 可以配置
9. 上下方向键控制的时候, 主动设置对应item为激活class, 还有回车键都使用阻止冒泡, 防止提交表单
10. 增加动画
11. 增加选中, 等自定义class

## 配置
**dataSource**
> 数据源, 可以是数组, 可以是json文件地址, 可以是函数(text)

```js
// 最终返回格式, 如果value字段为空, 则使用label填充
// 
var data = [
    {
        "label": "苹果",
        "value": "apple"
    },
    {
        "label": "香蕉",
        "value": "banana"
    }
];
```


```js
// 配置
{
    // 数据源
    dataSource: [],
    // 插入位置
    appendTo: '#someEle',
    // 敲击延迟, 对于本地数据推荐0延迟
    delay: 0,
    // 是否禁用
    disabled: false,
    // 最小长度, 比如匹配银行卡号, 输入11位数时才进行请求
    minLength: 0,
    // 过滤函数, 内置无过滤, 模糊匹配, 全字匹配, 默认的过滤器都支持是否大小写参数
    filter: null,
    // 是否清除前后空格
    istrim: true,
    // item选项模板
    tmp: '<li value="{{value}}">{{label}}</li>' 
}
```

```js
// 方法
var autocomplete = $('#input').AutoComplete();
// 显示
autocomplete.show();
// 隐藏
autocomplete.hide();
// 销毁
autocomplete.destroy();
// 主动搜索, 比如右侧一个搜索按钮,点击时候主动查询, value参数为空则使用input中的值
autocomplete.search(value);
```


## 重构
1. 数据反映视图, 改变数据只能从此接口改变
2. 视图控制独立
3. 将show, hide, select这些状态值隐射ref的属性中. 比如选中 武汉银行, `<input data-select="武汉银行">`, 验证时候就可以简单对比 input.value 是否等于 input.attr('data-select')



http-server -c-1




## 模拟异步
1. 输入 `a` 开始ajax获取数据, 此ajax设置`3秒`返回结果
2. 输入 `aa` 开始ajax获取数据, 此ajax设置`2秒`返回结果
3. 输入 `aaa` 开始ajax获取数据, 此ajax设置`0.5秒`返回结果