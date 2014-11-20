Msg
===

订阅者/发布者模式，自定义消息类型的工具库

##关于Msg

Msg是基于订阅者/发布者模式的事件库，事件被抽象为`消息订阅/消息传播`模式。Msg 为 Message 的缩写。

##API介绍

Msg 的API 比较简单，其介绍都浓缩在`test.html`页面中，将js部分粘贴如下

```javascript
    (function() {

        var test = new Msg()

        //test on

        //普通绑定
        test.on('msg1', function() {
            console.log(arguments)
        })

        //多次绑定
        test.on('msg1', function() {
            console.log(arguments)
            console.log('msg1 二次绑定')
        })

        //批量绑定
        test.on(['msg2', 'msg3', 'msg4', 'msg5', 'msg6'], function() {
            console.log(arguments)
        })

        console.log(test)

        //test spread

        //触发全部
        test.spread()

        //触发全部并携带数据
        test.spread(null, '触发全部并携带数据 * 1', '触发全部并携带数据l * 2')

        //触发一类消息
        test.spread('msg1', '触发一类消息 msg1 * 1')

        //触发一组消息类型
        test.spread(['msg2', 'msg3', 'msg4', 'msg1'], '触发一组消息类型')


        //test once

        test.once('test_once', function(msg) {
            console.log('触发一次后，接触绑定 ' + msg)
        })

        test.on('test_once', function(msg) {
            console.log('虽然也是test_once，但用on 绑定，所以还在绑定中 \n' + msg)
        })


        test.spread('test_once', 'test_once done!')

        setTimeout(function() {
            test.spread('test_once', '测试是否解除了 once 的绑定，由于是异步删除，所以也得异步测试')
        }, 10)


        // test hold

        test.hold('test_hold', 5, function(times) {
            console.log('hold 方法可以挂起事件，在触发次数达到指定次数之后， 才作出反应：' + times)
        })


        test.spread('test_hold', 1)
        test.spread('test_hold', 2)
        test.spread('test_hold', 3)
        test.spread('test_hold', 4)
        test.spread('test_hold', 5)
        test.spread('test_hold', '达到次数后，就可以自如启动反应了')

        //test tie

        //设置命名空间，可以方便的用 test.off('.nameSpace') 一次性解除
        test.tie(['tie1.nameSpace', 'tie2.nameSpace', 'tie3.nameSpace', 'tie4.nameSpace'], function(tie1, tie2, tie3, tie4) {
            console.log('tie 方法绑定所有事件，在它们至少都被触发过一次之后，才产生反应')
            console.log(arguments)
        })

        test.spread('tie2', 'tie2 data', 'tie2 data', 'tie2 data')
        test.spread('tie4', 'tie4 data')
        test.spread('tie1', 'tie1 data')
        test.spread('tie3', 'tie3 data do')
        test.spread('tie3', 'tie3 data done')

        //test tick

        test.tick('msg2', 'tick 是异步启动')
        test.spread('msg2', 'spread 是同步启动，所以这条消息应该在tick之前')

        //test delay

        test.delay(1000, 'msg2', 'delay 是延迟启动，这条消息在1000后才发出来')

        //test off

        //取消一类消息
        test.off('msg3')
        test.spread('msg3', 'msg2已经被取消，这条消息不会出现')

        //根据命名空间取消消息反应
        test.off('.nameSpace')

        //取消一组消息类型
        test.off(['msg1', 'msg4', 'msg5'])
        test.spread(['msg1', 'msg4', 'msg5', 'msg6'], '这组消息队列大多被取消了，只剩msg6')

        //取消所有消息反应
        setTimeout(function() {
            test.off()
            test.spread(null, '前面有测试延迟启动，时常为1秒，所以取消所有消息反应的测试，也应在1秒后进行，这条消息不会出现在控制台，因为所有消息反应都被取消')
        }, 1000)


    }());
```
