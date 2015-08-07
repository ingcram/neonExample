
if (typeof global === "undefined") {
    global = window;
}

global.Interface = function Interface(nameOrNameSpace, name) {
    var nameSpace, interfaceName, factory;
    nameSpace = (nameOrNameSpace && name) ? nameOrNameSpace : this;
    interfaceName = (nameOrNameSpace && name) ? name :
        (nameOrNameSpace) ? nameOrNameSpace : 'interface' + Math.random().toString();
    factory = function(definition) {
        definition.isInterface = true;
        definition.name = interfaceName;
        nameSpace[interfaceName] = definition;
        return nameSpace[interfaceName];
    };
    return factory;
};

global.Module = function Module(nameOrNameSpace, name) {
    var nameSpace, moduleName, factory, newModule;

    nameSpace = (nameOrNameSpace && name) ? nameOrNameSpace : this;
    moduleName = (nameOrNameSpace && name) ? name :
        (nameOrNameSpace) ? nameOrNameSpace : 'module' + Math.random().toString();

    newModule = {
        moduleName : moduleName,
        prototype : {},
        __includedModules : [],
        include : function(module) {
            var property;
            for (property in module) {
                if (module.hasOwnProperty(property)
                    && property !== 'prototype'
                    && property !== 'isModule'
                    && property !== '__includedModules'
                    && property !== 'include'
                    && property !== 'moduleName') {
                    newModule[property] = module[property];
                }
            }

            if (module.hasOwnProperty('prototype') && module.prototype) {
                for (property in module.prototype) {
                    if (module.prototype.hasOwnProperty(property)) {
                        newModule.prototype[property] = module.prototype[property];
                    }
                }
            }
            else {
                module.prototype = {};
            }

            this.__includedModules.push(module);

            return this;
        }
    }

    factory = function(definition){
        var property;

        newModule.isModule = true;

        for (property in definition) {
            if (definition.hasOwnProperty(property)
                && property !== 'prototype'
                && property !== 'isModule'
                && property !== '__includedModules'
                && property !== 'include'
                && property !== 'moduleName') {
                newModule[property] = definition[property];
            }
        }

        if (definition.hasOwnProperty('prototype') && definition.prototype) {
            for (property in definition.prototype) {
                if (definition.prototype.hasOwnProperty(property)) {
                    newModule.prototype[property] = definition.prototype[property];
                }
            }
        }

        nameSpace[moduleName] = newModule;

        return nameSpace[moduleName];
    };

    factory.includes = function () {
        for(var i = 0; i < arguments.length; i++){
            newModule.include(arguments[i]);
        }
        return factory;
    };

    return factory;
};

global.Class = function Class(classNameOrNameSpace, className) {
    var nameSpace, newClass, classFactory;
    nameSpace = (classNameOrNameSpace && className) ? classNameOrNameSpace : global;
    className = (classNameOrNameSpace && className) ? className :
        (classNameOrNameSpace) ? classNameOrNameSpace : 'class' + Math.random().toString();

    newClass = function() {
        if (this.init) {
            this.init.apply(this, arguments);
        }
    };

    newClass.__descendants = [];
    newClass.__implementedInterfaces = [];
    newClass.__includedModules = [];
    newClass.className = className;
    newClass.include = function(module) {
        var property;
        for (property in module) {
            if (module.hasOwnProperty(property)
                && property != 'prototype'
                && property != 'constructor'
                && property != 'isModule'
                && property != 'superClass'
                && property != 'include') {
                newClass[property] = module[property];
            }
        }

        if (module.hasOwnProperty('prototype') && module.prototype) {
            for (property in module.prototype) {
                if (module.prototype.hasOwnProperty(property)) {
                    newClass.prototype[property] = module.prototype[property];
                }
            }
        } else {
            module.prototype = {};
        }

        newClass.__includedModules.push(module);
        return this;
    };

    classFactory = function(classDefinition) {
        var i, il, j, jl, property, classPrototype = classDefinition.prototype;
        if (classPrototype) {
            for (property in classPrototype) {
                if (classPrototype.hasOwnProperty(property)) {
                    newClass.prototype[property] = classPrototype[property];
                }
            }
            delete classDefinition.prototype;
        }
        for (property in classDefinition) {
            if (classDefinition.hasOwnProperty(property)) {
                newClass[property] = classDefinition[property];
            }
        }

        for (i = 0, il = newClass.__implementedInterfaces.length; i < il; i++) {
            for (j = 0, jl = newClass.__implementedInterfaces[i].constructor.length; j < jl; j++) {
                if (!newClass[ newClass.__implementedInterfaces[i].constructor[j] ]) {
                    console.log('must implement static ' + newClass.__implementedInterfaces[i].name);
                    break;
                }
            }

            if (newClass.__implementedInterfaces[i].hasOwnProperty('prototype')
                && newClass.__implementedInterfaces[i].prototype) {
                for (j = 0, jl = newClass.__implementedInterfaces[i].prototype.length; j < jl; j++) {
                    if (!newClass.prototype[newClass.__implementedInterfaces[i].prototype[j]]) {
                        console.log('must implement prototype ' + newClass.__implementedInterfaces[i].name);
                        break;
                    }
                }
            }
        }

        try {
            if (Li && Li.ObjectSpy && Li.Spy) {
                newClass.__objectSpy = new Li.ObjectSpy();
                newClass.__objectSpy.spy(newClass);
                newClass.__objectSpy.spy(newClass.prototype);
            }
        } catch (error) {}

        nameSpace[className] = newClass;
        return newClass;
    };

    classFactory.inherits = function(superClass) {
        var i, inheritedClass;
        newClass.superClass = superClass;
        if (superClass.hasOwnProperty('__descendants')) {
            superClass.__descendants.push(newClass);
        }
        inheritedClass = function() {
        };
        inheritedClass.prototype = superClass.prototype;
        newClass.prototype = new inheritedClass();
        newClass.prototype.constructor = newClass;

        for (i in superClass) {
            if (superClass.hasOwnProperty(i)
                && i != 'prototype'
                && i !== 'className'
                && i !== 'superClass'
                && i !== 'include'
                && i != '__descendants') {
                newClass[i] = superClass[i];
            }
        }

        delete this.inherits;
        return this;
    };

    classFactory.ensures = function(interfaces) {
        for (var i = 0; i < arguments.length; i++) {
            newClass.__implementedInterfaces.push(arguments[i]);
        }
        delete this.ensures;
        return classFactory;
    };

    classFactory.includes = function() {
        for (var i = 0; i < arguments.length; i++) {
            newClass.include(arguments[i]);
        }
        return classFactory;
    };

    return classFactory;

};

Module('NodeSupport')({
    prototype : {
        parent      : null,

        children    : [],

        appendChild : function(child) {
            if(child.parent) {
                child.parent.removeChild(child);
            }

            if(!this.hasOwnProperty('children')) {
                this.children = [];
            }

            this.children.push(child);
            this[child.name] = child;
            child.setParent(this);
            return child;
        },

        insertBefore : function (child, beforeChild) {
            var position;

            if (child.parent) {
                child.parent.removeChild(child);
            }

            if (!this.hasOwnProperty('children')) {
                this.children = [];
            }

            if (typeof beforeChild === 'undefined') {
                this.appendChild(child);
            } else {
                position = this.children.indexOf(beforeChild);
                this.children.splice(position, 0, child);

                this[child.name] = child;
                child.setParent(this);
            }

            return child;

        },

        insertChild : function(child, position) {
            console.warn('NodeSupport insertChild method is deprecated, try insertBefore');

            if (child.parent) {
                child.parent.removeChild(child);
            }

            if (!this.hasOwnProperty('children')) {
                this.children = [];
            }

            if (typeof position == 'undefined') {
                this.children.push(child);
                this[child.name] = child;
                child.setParent(this);
                return child;
            }

            this.children.splice(position, 0, child);
            this[child.name] = child;
            child.setParent(this);
            return child;
        },

        removeChild : function (child) {
            var position = this.children.indexOf(child);

            if (position !== -1) {
                this.children.splice(position, 1);
                delete this[child.name];
                child.parent = null;
            }

            return child;
        },

        setParent   : function (parent) {
            this.parent = parent;
            return this;
        },

        getDescendants : function () {
            var nodes = [];
            this.children.forEach(function (node) {
                nodes.push(node);
            });
            this.children.forEach(function (node) {
                nodes = nodes.concat(node.getDescendants());
            });
            return nodes;
        },

        getPreviousSibling : function () {
            if (typeof this.parent === 'undefined') {
                return;
            }

            if (this.parent.children[0] === this) {
                return;
            }

            return this.parent.children[ this.parent.children.indexOf(this) - 1 ];
        },

        getNextSibling : function () {
            if (typeof this.parent === 'undefined') {
                return;
            }

            if (this.parent.children[ this.parent.children.length - 1 ] === this) {
                return;
            }

            return this.parent.children[ this.parent.children.indexOf(this) + 1 ];
        }
    }
});

Class('CustomEvent')({
    prototype : {
        bubbles                       : true,
        cancelable                    : true,
        currentTarget                 : null,
        timeStamp                     : 0,
        target                        : null,
        type                          : '',
        isPropagationStopped          : false,
        isDefaultPrevented            : false,
        isImmediatePropagationStopped : false,
        areImmediateHandlersPrevented : false,
        init : function init(type, data) {
            this.type = type;
            if (typeof data !== 'undefined') {
                for(var property in data) {
                    if (data.hasOwnProperty(property)) {
                        this[property] = data[property];
                    }
                }
            }
        },
        stopPropagation : function stopPropagation() {
            this.isPropagationStopped = true;
        },
        preventDefault : function preventDefault() {
            this.isDefaultPrevented = true;
        },
        stopImmediatePropagation : function stopImmediatePropagation() {
            this.preventImmediateHandlers();
            this.stopPropagation();
        },
        preventImmediateHandlers : function preventImmediateHandlers() {
            this.areImmediateHandlersPrevented = true;
        }
    }
});

Module('CustomEventSupport')({

    eventListeners : null,

    bind : function(type, eventHandler) {
        var found, i, listeners;

        if(!this.eventListeners) {
            this.eventListeners = {};
        }

        if(!this.eventListeners[type]) {
            this.eventListeners[type] = [];
        }

        found  = false;

        listeners = this.eventListeners[type];
        for (i = 0; i < listeners.length; i++) {
            if (listeners[i] === eventHandler) {
                found = true;
                break;
            }
        }

        if(!found) {
            this.eventListeners[type].push(eventHandler);
        }

        return this;
    },

    unbind : function(type, eventHandler) {
        var i, found, listeners;

        found  = false;

        if(!this.eventListeners) {
            this.eventListeners = {};
        }

        if(typeof eventHandler == 'undefined') {
            this.eventListeners[type] = [];
        }

        listeners = this.eventListeners[type];
        for (i = 0; i < listeners.length; i++) {
            if(listeners[i] === eventHandler) {
                found = true;
                break;
            }
        }

        if(found) {
            this.eventListeners[type].splice(i, 1);
        }

        return this;
    },

    dispatch : function(type, data) {
        var event, listeners, instance, i;

        if (this.eventListeners === null) {
            this.eventListeners = {};
        }

        if (typeof data === 'undefined') {
            data = {};
        }

        if (data.hasOwnProperty('target') === false) {
            data.target = this;
        }

        event         = new CustomEvent(type, data);
        listeners     = this.eventListeners[type] || [];
        instance      = this;

        for (i = 0; i < listeners.length; i = i + 1) {
            listeners[i].call(instance, event);
            if (event.areImmediateHandlersPrevented === true) {
                break;
            }
        }

        return event;
    },

    prototype : {

        eventListeners : null,

        bind : function(type, eventHandler) {
            var found, i, listeners;

            if(!this.eventListeners) {
                this.eventListeners = {};
            }

            if(!this.eventListeners[type]) {
                this.eventListeners[type] = [];
            }

            found  = false;

            listeners = this.eventListeners[type];
            for (i = 0; i < listeners.length; i++) {
                if(listeners[i] === eventHandler) {
                    found = true;
                    break;
                }
            }

            if(!found) {
                this.eventListeners[type].push(eventHandler);
            }

            return this;
        },

        unbind : function(type, eventHandler) {
            var i, found, listeners;

            found = false;
            i     = 0;

            if(!this.eventListeners) {
                this.eventListeners = {};
            }

            if(typeof eventHandler == 'undefined') {
                this.eventListeners[type] = [];
            }

            listeners = this.eventListeners[type];
            for (i = 0; i < listeners.length; i++) {
                if(listeners[i] == eventHandler) {
                    found = true;
                    break;
                }
            }

            if(found) {
                this.eventListeners[type].splice(i, 1);
            }

            return this;
        },

        dispatch : function(type, data) {
            var event, listeners, instance, i;

            if (this.eventListeners === null) {
                this.eventListeners = {};
            }

            if (typeof data === 'undefined') {
                data = {};
            }

            if (data.hasOwnProperty('target') === false) {
                data.target = this;
            }

            event         = new CustomEvent(type, data);
            listeners     = this.eventListeners[type] || [];
            instance      = this;

            for (i = 0; i < listeners.length; i = i + 1) {
                listeners[i].call(instance, event);
                if (event.areImmediateHandlersPrevented === true) {
                    break;
                }
            }

            return event;
        }
    }
});

Class('Widget').includes(CustomEventSupport, NodeSupport)({

    /**
     The default html for the widget, at the most simple case this is just a div.
     @name HTML
     @attribute_type CONSTANT
     @type String
     */
    HTML : '<div></div>',

    /**
     the widget container default class for all widgets is widget
     @name ELEMENT_CLASS
     @constant
     @type String
     **/
    ELEMENT_CLASS : 'widget',

    /**
     @property prototype
     @type Object
     **/
    prototype : {
        /**
         Holds the active status of the widget
         By default all widgets are deactivated waiting
         for an action to activate it.
         @property active <public> [Boolean] (false)
         **/
        active : false,

        /**
         Holds the disabled status of the widget
         By default all widgets are enabled and only by
         API could be disabled.
         @property disabled <public> [Boolean] (false)
         **/
        disabled : false,

        __destroyed : false,

        init : function init(config) {
            var property, temporalElement;

            Object.keys(config || {}).forEach(function (propertyName) {
                this[propertyName] = config[propertyName];
            }, this);

            if (this.element == null) {
                temporalElement = document.createElement('div');
                temporalElement.innerHTML = this.constructor.HTML.replace(/\s\s+/g, '');
                this.element = temporalElement.firstChild;

                this.constructor.ELEMENT_CLASS.split(' ').forEach(function(className) {
                    this.element.classList.add(className);
                }, this);

                temporalElement = null;
            }

            if (this.hasOwnProperty('className') === true) {
                this.className.split(' ').forEach(function(className) {
                    this.element.classList.add(className);
                }, this);
            }
        },

        /**
         implementation of the activate method, when you need an override, do it
         over this method instead of doing it on activate
         @property _activate <private> [Function]
         @return undefined [undefined]
         **/
        _activate : function _activate() {
            this.active = true;
            this.element.classList.add('active');
        },

        /**
         Public activation method for widget, you can listen to this event
         to take some other actions, but the most important part of this
         method is that it runs its default action, (its activation)
         this method uses _activate as its implementation to maintain
         the events order intact.
         @property activate <public> [Function]
         @method
         @dispatch beforeActivate
         @dispatch activate
         @return this [Widget]
         **/
        activate : function activate() {
            if (this.__destroyed === true) {
                console.warn('calling on destroyed object');
            }
            this.dispatch('beforeActivate');
            this._activate();
            this.dispatch('activate');
            return this;
        },

        /**
         deactivation implementation
         this is the oposite of activation method and as such it must be
         treated as important as that.
         @property _deactivate <private> [Function]
         @method
         @return undefined [undefined]
         **/
        _deactivate : function _deactivate() {
            this.active = false;
            this.element.classList.remove('active');
        },

        /**
         Public deactivation method for widget, you can listen to this event
         to take some other actions, but the most important part of this
         method is that it runs its default action, (its activation)
         this method uses _deactivate as its implementation to maintain
         the events order intact.
         @property activate <public> [Function]
         @method
         @dispatch beforeDeactivatee
         @dispatch deactivate
         @return this [Widget]
         **/
        deactivate : function deactivate() {
            if (this.__destroyed === true) {
                console.warn('calling on destroyed object');
            }
            this.dispatch('beforeDeactivate');
            this._deactivate();
            this.dispatch('deactivate');
            return this;
        },

        /**
         Enable implementation method
         if you need to provide a different procedure for enable
         you must override this method and call "super"
         @property _enable <private> [Function]
         @method
         @return undefined [undefined]
         **/
        _enable : function _enable() {
            this.disabled = false;
            this.element.classList.remove('disable');
        },

        /**
         Public enable method, this method should not be
         overriden.
         @property enable <public> [Function]
         @method
         @return this [Widget]
         **/
        enable : function enable() {
            if (this.__destroyed === true) {
                console.warn('calling on destroyed object');
            }
            this.dispatch('beforeEnable');
            this._enable();
            this.dispatch('enable');

            return this;
        },

        /**
         Disable implementation
         @property _disable <private> [Function]
         @return undefined [undefined]
         **/
        _disable : function _disable() {
            this.disabled = true;
            this.element.classList.add('disable');
        },

        /**
         Disables the widget, the idea behind disabling a widget
         comes from DOM form elements. so following this idea
         all widgets can be disabled and queried for its disabled
         state via the disabled property.
         Same as DOM form elements there is feedback and that is why
         the default implementation sets the "disable" class
         on the element so proper visual feedback can be provided
         to the user.
         @property disable <public> [Function]
         @method
         @return this [Widget]
         **/
        disable : function disable() {
            if (this.__destroyed === true) {
                console.warn('calling on destroyed object');
            }
            this.dispatch('beforeDisable');
            this._disable();
            this.dispatch('disable');

            return this;
        },

        /**
         Destroy implementation. Its main responsabilities are cleaning
         all references to other objects so garbage collector can collect
         the memory used by this and the other objects
         @property _destroy <private> [Function]
         @method
         @return undefined [undefined]
         **/
        _destroy : function _destroy() {
            var childrenLength;

            if (this.element) {
                if (this.element.parentNode) {
                    this.element.parentNode.removeChild(this.element);
                }
            }

            if (this.children !== null){
                childrenLength = this.children.length;
                while(childrenLength > 0){
                    this.children[0].destroy();
                    if (this.children.length === childrenLength) {
                        this.children.shift();
                    }
                    childrenLength--;
                }
            }

            if (this.parent) {
                this.parent.removeChild(this);
            }

            this.children = null;
            this.element = null;
        },

        /**
         Destroy public method, this one should not be replaced
         @property destroy <public> [Function]
         @method
         @return null [null]
         **/
        destroy : function destroy() {
            if (this.__destroyed === true) {
                console.warn('calling on destroyed object');
            }

            this.dispatch('beforeDestroy');
            this._destroy();
            this.dispatch('destroy');

            this.eventListeners = null;
            this.__destroyed    = true;

            return null;
        },

        /**
         The render method is the mechanism by which you pass a widget from
         living only on memory to get into the DOM and with this into the
         application flow. The recomendation is that render is the last method
         of the setup of a widget, including appending its children. this is
         because once a widget gets renderer, further operations cause browser
         reflows, and DOM operations are slower than memory operations.
         This method shoudl not be replaced by its children.
         @property render <public> [Function]
         @method
         @argument element <required> [JQuery] (undefined) This is the element
         into which the widget will be appended.
         @argument beforeElement <optional> [HTMLDOMElement] (undefined) this is the element
         that will be used as a reference to insert the widgets element. this argument
         must be a child of the "element" argument.
         @return this [Widget]
         **/
        render : function render(element, beforeElement) {

            if (this.__destroyed === true) {
                console.warn('calling on destroyed object');
            }
            this.dispatch('beforeRender', {
                element : element,
                beforeElement : beforeElement
            });
            if (beforeElement) {
                element.insertBefore(this.element, beforeElement);
            } else {
                element.appendChild(this.element);
            }
            this.dispatch('render');
            return this;
        }
    }
});

window.TodoList = {};
TodoList.UI = {};

Class(TodoList.UI, 'TaskBar').inherits(Widget)({
    HTML : '<div>\
            </div>',
    prototype : {
        init : function init(config) {
            Widget.prototype.init.call(this, config);

        },

        /**
         * Return the DOM element reference.
         * @property getElement <public> [Function]
         * @return this.el [Object]
         */
        getElement : function getElement() {
            return this.element;
        },

        updateStatusRemaining : function (remaining) {

            if (this.statusRemaining === undefined) {
                this.appendChild(new TodoList.UI.StatusRemaining({
                    name : 'statusRemaining'
                }));
            }

            if ( remaining > 0 ) {

                this.statusRemaining.setRemaining(remaining);

                this.statusRemaining.render(this.element);
            }else{
                this.statusRemaining.destroy();
            }

        },

        updateStatusDone: function (done) {

            if (this.statusDone === undefined) {
                this.appendChild(new TodoList.UI.StatusDone({
                    name : 'statusDone'
                }));
            }

            if ( done > 0 ) {

                this.statusDone.setDone(done);

                this.statusDone.render(this.element);
            }else{
                this.statusDone.destroy();
            }

        },

        destroy : function destroy() {
            Widget.prototype.destroy.call(this);

            return null;
        }
    }
});

Class(TodoList.UI, 'StatusRemaining').inherits(Widget)({
    HTML : '<span class="task-count">\
                <span class="task-remaining">1</span>\
                <span class="task-remaining-label">tarea </span>pendiente.\
            </span>',
    prototype : {
        init : function init(config) {
            Widget.prototype.init.call(this, config);
            this.Remaining = this.element.querySelector('.task-remaining');
            this.RemainingLabel = this.element.querySelector('.task-remaining-label');
        },

        /**
         * Return the DOM element reference.
         * @property getElement <public> [Function]
         * @return this.el [Object]
         */
        getElement : function getElement() {
            return this.element;
        },

        setRemaining : function (remaining) {
            this.Remaining.textContent = remaining;
            this._updateRemainingLabel (remaining);
        },

        _updateRemainingLabel : function (remaining) {

            var label;
            if ( remaining == 1) {
                label = ' tarea ';
            }else{
                label = ' tareas ';
            }
            this.RemainingLabel.textContent = label;
        },

        destroy : function destroy() {
            Widget.prototype.destroy.call(this);

            return null;
        }
    }
});

Class(TodoList.UI, 'StatusDone').inherits(Widget)({
    HTML : '<a href="#" class="task-clear">\
                <span class="task-done">1</span>\
                <span class="task-done-label">tarea</span> completa\
            </a>',
    prototype : {
        init : function init(config) {
            Widget.prototype.init.call(this, config);
            this.Done = this.element.querySelector('.task-done');
            this.DoneLabel = this.element.querySelector('.task-done-label');
            this._bindEvents();
        },

        _bindEvents : function () {
            this.element.addEventListener('click', this._doneBtnClickHandler.bind(this), true);
        },

        /**
         * Return the DOM element reference.
         * @property getElement <public> [Function]
         * @return this.el [Object]
         */
        getElement : function getElement() {
            return this.element;
        },

        setDone : function (tasks) {
            this.Done.textContent = tasks;
            this._updateDoneLabel (tasks);
        },

        _updateDoneLabel : function (tasksDone) {
            var label;
            if (tasksDone == 1) {
                label = ' tarea ';
            }else{
                label = ' tareas ';
            }
            this.DoneLabel.textContent = label;
        },

        _doneBtnClickHandler : function (e) {
            this.constructor.dispatch('delete-tasks-complete');
        },

        destroy : function destroy() {
            Widget.prototype.destroy.call(this);

            return null;
        }
    }
});


Class(TodoList.UI, 'List').inherits(Widget)({
    HTML : '<ul class="lists-task"></ul>',
    prototype : {
        init : function init(config) {
            Widget.prototype.init.call(this, config);
            this._tasksRemaining = 0;
            this._tasksDone = 0;
            this._bindEvents();
        },

        _bindEvents : function _bindEvents() {

            TodoList.UI.Task.bind('remove-item', function(item) {
                this._itemRemove(item,this);
            }.bind(this));

            TodoList.UI.Task.bind('change', function(dataEvent) {
                this._updateDone(dataEvent.data,this);
            }.bind(this));

            return this;
        },

        /**
         * Return the DOM element reference.
         * @property getElement <public> [Function]
         * @return this.el [Object]
         */
        getElement : function getElement() {
            return this.element;
        },

        setText : function setText(text) {
            this.element.textContent = text;
            return this;
        },

        addItem : function (text) {
            var task = new TodoList.UI.Task();
            task.setText(text);
            this.renderItem(task);
            this._triggerUpdateStatus();
        },

        _itemRemove : function (item,e) {
            if(item.checkbox.checked) {
                this._updateDone('undone');
            }
            this._triggerUpdateStatus();
        },

        _updateDone : function (status) {
            if (status == 'done') {
                this._tasksDone +=  1;
            }else{
                this._tasksDone -=  1;
            }
            this._triggerUpdateStatus();
        },

        getDone : function () {
            return this._tasksDone;
        },

        getItems : function () {
            return this.children.length ;
        },

        renderItem : function (item) {
            this.appendChild(item).render(this.element);
        },

        _triggerUpdateStatus : function () {
            this.constructor.dispatch('update-status');
        },

        destroy : function destroy () {
            Widget.prototype.destroy.call(this);

            return null;
        },

        deleteItemsComplete : function () {

            for (var i = (this.children.length - 1); i >= 0; i--) {

                if (this.children[i].done) {
                    this.children[i].destroy();
                    this._tasksDone -=  1;
                }
            }
            this._triggerUpdateStatus();
        }
    }
});

Class(TodoList.UI, 'Task').inherits(Widget)({
    HTML : '\
            <li class="task-item">\
                <div class="task-view">\
                    <input type="checkbox" class="task-checkbox">\
                    <span class="task-content" ></span>\
                </div>\
                <div class="task-edit">\
                    <input type="text" class="task-edit-input" value="">\
                </div>\
                <a href="#">\
                    <span class="task-remove-icon">X</span>\
                </a>\
            </li>\
            ',
    prototype : {
        init : function init(config) {
            Widget.prototype.init.call(this, config);
            this.remove = this.element.querySelector('.task-remove-icon');
            this.checkbox = this.element.querySelector('.task-checkbox');
            this.content = this.element.querySelector('.task-content');
            this.input = this.element.querySelector('.task-edit-input');
            this.done = false;
            this._bindEvents();
        },

        _bindEvents : function () {

            this.remove.addEventListener('click', this._removeHandler.bind(this), false);

            this.checkbox.addEventListener('change', this._checkboxChangeHandler.bind(this), false);

            this.content.addEventListener('click', this._contentClickHandler.bind(this), false);

            this.input.addEventListener('keyup', this._inputKeyPressHandler.bind(this), false);

            this.input.addEventListener('blur', this._inputOnBlurHandler.bind(this), false);

            return this;
        },

        _removeHandler : function (e) {
            this.destroy();
            this.constructor.dispatch('remove-item', this);
        },

        _checkboxChangeHandler : function (e) {

            if (this.checkbox.checked) {
                this.done = true;
                this.content.className += " task-done";
                this.constructor.dispatch('change', {data:'done'});
            }else {
                this.done = false;
                this.content.className = "task-checkbox";
                this.constructor.dispatch('change', {data: 'undone'});
            }
        },

        _inputKeyPressHandler : function (e) {
            this.setText(this.input.value);
            var charCode;
            charCode = (typeof e.which === "number") ? e.which : e.keyCode;
            if (charCode === 13) {
                this._inputOnBlurHandler(e);
            }
        },

        _contentClickHandler : function (e) {
            if (this.content) {
                this.element.className += " editing";
                this.input.focus();
            }
        },

        _inputOnBlurHandler : function (e) {
            this.element.className = "widget task-item";
        },

        getElement : function getElement() {
            return this.element;
        },

        setText : function setText(text) {
            this.content.textContent =  text;
            this.input.value = text;
            return this;
        },

        destroy : function destroy() {
            Widget.prototype.destroy.call(this);
            return null;
        }
    }
});

Class(TodoList, 'App').includes(CustomEventSupport, NodeSupport)({
    prototype : {
        _body : null,
        _values : null,
        _hash : null,
        _ui : null,
        init : function init() {
            this._body = document.body;
            this._hash = window.location.hash;
            this._ui = {
                input: document.querySelector('[type="text"]'),
                lista : document.querySelector('.todo__list'),
                options : document.querySelector('.todo_list_options'),
                creditsBtn : document.querySelector('.credits-btn'),
            }
        },

        /**
         * Boot the little app.
         * @property run <public> [Function]
         * @return TodoList.App [Object]
         */
        run : function () {
            this.updateUI();
            this._bindEvents();
            return this;
        },

        _bindEvents : function _bindEvents() {

            TodoList.UI.List.bind('update-status', function() {
                this._updateStatusHandler.call(this);
            }.bind(this));

            TodoList.UI.StatusDone.bind('delete-tasks-complete', function() {
                this._deleteTasksCompleteHandler.call(this);
            }.bind(this));

            this._ui.input.addEventListener("keypress", this._inputKeypressHandler.bind(this), false);

            return this;
        },

        _updateStatusHandler : function (e) {
            this._updateStatusBar(e);
        },

        _deleteTasksCompleteHandler : function (e) {
            this.tasksListContainer.deleteItemsComplete();
        },

        _updateStatusBar : function (e) {
            var remaining = 0;
            var done = 0;
            done = this.tasksListContainer.getDone();
            remaining = this.tasksListContainer.getItems();
            remaining = remaining - done;
            this.taskBar.updateStatusRemaining(remaining);
            this.taskBar.updateStatusDone( done );
        },

        _inputKeypressHandler : function (e) {
            var charCode;
            charCode = (typeof e.which === "number") ? e.which : e.keyCode;
            if (charCode === 13) {
                this._addTaskClickHandler(e);
            }
            return this;
        },

        _addTaskClickHandler : function _addTaskClickHandler(event) {

            if (this._ui.input.value != '') {
                this.tasksListContainer.addItem(this._ui.input.value);
                this._ui.input.value ='';
            }
        },

        updateUI : function updateUI() {

            this._body.scrollTop = 0;

            this.appendChild(new TodoList.UI.List({
                name: 'tasksListContainer'
            }));
            this.appendChild(new TodoList.UI.TaskBar({
                name: 'taskBar'
            }));
            this.tasksListContainer.render(this._ui.lista);
            this.taskBar.render(this._ui.lista);

            return this;
        },

        destroy : function destroy() {
            this._body = null;
            this._ui = null;

            Widget.prototype.destroy.call(this);
        }
    }
});

(function() {
    todoList = new TodoList.App();
    todoList.run();
})();
