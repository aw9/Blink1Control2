"use strict";

var React = require('react');

var Grid = require('react-bootstrap').Grid;
var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;
// var FormControls = require('react-bootstrap').FormControls;
var LinkedStateMixin = require('react-addons-linked-state-mixin');

var Switch = require('react-bootstrap-switch');

var log = require('../../logger');


var SkypeStateForm = React.createClass({
    mixins: [LinkedStateMixin],
    propTypes: {
        rule: React.PropTypes.object.isRequired,
        patterns: React.PropTypes.array,
        onSave: React.PropTypes.func,
        onCancel: React.PropTypes.func,
        onDelete: React.PropTypes.func,
        onCopy: React.PropTypes.func
    },
    getInitialState: function() {
        return {};// empty state, will be set in componentWillReceiveProps()
    },
    componentWillReceiveProps: function(nextProps) {
        var rule = nextProps.rule;
        this.setState({
            type:'skypestate',
            enabled: rule.enabled,
            name: rule.name,
            username: rule.username,
            password: rule.password,
        });
    },

    handleClose: function() {
        console.log("CLOSING: state=",this.state);
        if( !this.state.username || !this.state.password ) {
            this.setState({errormsg: "username or password not set!"});
            return;
        }
        this.props.onSave(this.state);
    },
    render: function() {
        var self = this;

        return (
            <div>
                <Modal show={this.props.show} onHide={this.handleClose} >
                    <Modal.Header>
                        <Modal.Title>Skypestate Settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                        <form className="form-horizontal" >
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8"
                                type="text" label="Name" placeholder="Enter text"
                                valueLink={this.linkState('name')} />
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-8"
                                type="text" label="Skype username" placeholder="Enter username (usually full email address)"
                                valueLink={this.linkState('username')} />
                            <Input labelClassName="col-xs-3" wrapperClassName="col-xs-5"
                                type="password" label="Password" placeholder=""
                                valueLink={this.linkState('password')} />
                        </form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Row>
                            <Col xs={5}>
                                <Button bsSize="small" bsStyle="danger" onClick={this.props.onDelete} style={{float:'left'}}>Delete</Button>
                                <Button bsSize="small" onClick={this.props.onCopy} style={{float:'left'}}>Copy</Button>
                            </Col>
                            <Col xs={3}>
                                    <Switch size="small" labelText="Enable"
                                        state={this.state.enabled} onChange={function(s){self.setState({enabled:s});}} />
                            </Col>
                            <Col xs={4}>
                                <Button bsSize="small" onClick={this.props.onCancel}>Cancel</Button>
                                <Button bsSize="small" onClick={this.handleClose}>OK</Button>
                            </Col>
                        </Row>
                    </Modal.Footer>
                </Modal>
            </div>
        );
    }
});

module.exports = SkypeStateForm;
