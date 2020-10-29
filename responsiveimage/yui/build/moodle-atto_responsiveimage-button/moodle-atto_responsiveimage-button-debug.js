YUI.add('moodle-atto_responsiveimage-button', function (Y, NAME) {

// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/*
 * @package    atto_responsiveimage
 * @copyright  2013 Damyon Wiese  <damyon@moodle.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * @module moodle-atto_responsiveimage_alignment-button
 */

/**
 * Atto image selection tool.
 *
 * @namespace M.atto_responsiveimage
 * @class Button
 * @extends M.editor_atto.EditorPlugin
 */

var CSS = {
    RESPONSIVE: 'img-responsive',
    INPUTALIGNMENT: 'atto_responsiveimage_alignment',
    INPUTALT: 'atto_responsiveimage_altentry',
    INPUTHEIGHT: 'atto_responsiveimage_heightentry',
    INPUTSUBMIT: 'atto_responsiveimage_urlentrysubmit',
    INPUTURL: 'atto_responsiveimage_urlentry',
    INPUTSIZE: 'atto_responsiveimage_size',
    INPUTWIDTH: 'atto_responsiveimage_widthentry',
    IMAGEALTWARNING: 'atto_responsiveimage_altwarning',
    IMAGEBROWSER: 'atto_responsiveimage_openimagebrowser',
    IMAGEPRESENTATION: 'atto_responsiveimage_presentation',
    INPUTCONSTRAIN: 'atto_responsiveimage_constrain',
    INPUTCUSTOMSTYLE: 'atto_responsiveimage_customstyle',
    IMAGEPREVIEW: 'atto_responsiveimage_preview',
    IMAGEPREVIEWBOX: 'atto_responsiveimage_preview_box',
    ALIGNSETTINGS: 'atto_responsiveimage_button'
  },
  SELECTORS = {
    INPUTURL: '.' + CSS.INPUTURL
  },
  ALIGNMENTS = [
    // Vertical alignment.
    {
        name: 'verticalAlign',
        str: 'alignment_top',
        value: 'text-top',
        margin: '0 0.5em'
    }
  ],
  
  REGEX = {
    ISPERCENT: /\d+%/
  },
  
  COMPONENTNAME = 'atto_responsiveimage',
  
  TEMPLATE = '' +
        '<form class="atto_attoform">' +
  
            // Add the repository browser button.
            '{{#if showFilepicker}}' +
                '<div class="mb-1">' +
                    '<label for="{{elementid}}_{{CSS.INPUTURL}}">{{get_string "enterurl" component}}</label>' +
                    '<div class="input-group input-append w-100">' +
                        '<input class="form-control {{CSS.INPUTURL}}" type="url" ' +
                        'id="{{elementid}}_{{CSS.INPUTURL}}" size="32"/>' +
                        '<span class="input-group-append">' +
                            '<button class="btn btn-secondary {{CSS.IMAGEBROWSER}}" type="button">' +
                            '{{get_string "browserepositories" component}}</button>' +
                        '</span>' +
                    '</div>' +
                '</div>' +
            '{{else}}' +
                '<div class="mb-1">' +
                    '<label for="{{elementid}}_{{CSS.INPUTURL}}">{{get_string "enterurl" component}}</label>' +
                    '<input class="form-control fullwidth {{CSS.INPUTURL}}" type="url" ' +
                    'id="{{elementid}}_{{CSS.INPUTURL}}" size="32"/>' +
                '</div>' +
            '{{/if}}' +
  
            // Add the alignment selector.
            '<div class="form-inline mb-1">' +
            '<label class="for="{{elementid}}_{{CSS.INPUTALIGNMENT}}">{{get_string "alignment" component}}</label>' +
            '<select class="custom-select {{CSS.INPUTALIGNMENT}}" id="{{elementid}}_{{CSS.INPUTALIGNMENT}}">' +
                '{{#each alignments}}' +
                    '<option value="{{value}}">{{get_string str ../component}}</option>' +
                '{{/each}}' +
            '</select>' +
            '</div>' +
            // Hidden input to store custom styles.
            '<input type="hidden" class="{{CSS.INPUTCUSTOMSTYLE}}"/>' +
            '<br/>' +
  
            // Add the image preview.
            '<div class="mdl-align">' +
            '<div class="{{CSS.IMAGEPREVIEWBOX}}">' +
                '<img src="#" class="{{CSS.IMAGEPREVIEW}}" alt="" style="display: none;"/>' +
            '</div>' +
  
            // Add the submit button and close the form.
            '<button class="btn btn-secondary {{CSS.INPUTSUBMIT}}" type="submit">' + '' +
                '{{get_string "saveimage" component}}</button>' +
            '</div>' +
        '</form>',
  
  IMAGETEMPLATE = '' +
            '<img src="{{url}}" alt="Responsive image" ' +
                'class="attoresponsiveimage img-responsive"' +
                '{{#if id}}id="{{id}}" {{/if}}' +
                '/>';
  
  Y.namespace('M.atto_responsiveimage').Button = Y.Base.create('button', Y.M.editor_atto.EditorPlugin, [], {
  /**
  * A reference to the current selection at the time that the dialogue
  * was opened.
  *
  * @property _currentSelection
  * @type Range
  * @private
  */
  _currentSelection: null,
  
  /**
  * The most recently selected image.
  *
  * @param _selectedImage
  * @type Node
  * @private
  */
  _selectedImage: null,
  
  /**
  * A reference to the currently open form.
  *
  * @param _attoform
  * @type Node
  * @private
  */
  _attoform: null,
  
  /**
  * The dimensions of the raw image before we manipulate it.
  *
  * @param _rawImageDimensions
  * @type Object
  * @private
  */
  _rawImageDimensions: null,
  
  initializer: function() {
  
    this.addButton({
        icon: M.util.image_url("ed/" + 'editor_responsiveimage',"atto_responsiveimage"),
        callback: this._displayDialogue,
        tags: '.attoresponsiveimage',
        tagMatchRequiresAll: false
    });
    this.editor.delegate('dblclick', this._displayDialogue, '.attoresponsiveimage', this);
    this.editor.delegate('click', this._handleClick, '.attoresponsiveimage', this);
    this.editor.on('drop', this._handleDragDrop, this);
  
    // e.preventDefault needed to stop the default event from clobbering the desired behaviour in some browsers.
    this.editor.on('dragover', function(e) {
        e.preventDefault();
    }, this);
    this.editor.on('dragenter', function(e) {
        e.preventDefault();
    }, this);
  },
  
  /**
  * Handle a drag and drop event with an image.
  *
  * @method _handleDragDrop
  * @param {EventFacade} e
  * @return mixed
  * @private
  */
  _handleDragDrop: function(e) {
  
    var self = this,
        host = this.get('host'),
        template = Y.Handlebars.compile(IMAGETEMPLATE);
  
    host.saveSelection();
    e = e._event;
  
    // Only handle the event if an image file was dropped in.
    var handlesDataTransfer = (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length);
    if (handlesDataTransfer && /^image\//.test(e.dataTransfer.files[0].type)) {
  
        var options = host.get('filepickeroptions').image,
            savepath = (options.savepath === undefined) ? '/' : options.savepath,
            formData = new FormData(),
            timestamp = 0,
            uploadid = "",
            xhr = new XMLHttpRequest(),
            imagehtml = "",
            keys = Object.keys(options.repositories);
  
        e.preventDefault();
        e.stopPropagation();
        formData.append('repo_upload_file', e.dataTransfer.files[0]);
        formData.append('itemid', options.itemid);
  
        // List of repositories is an object rather than an array.  This makes iteration more awkward.
        for (var i = 0; i < keys.length; i++) {
            if (options.repositories[keys[i]].type === 'upload') {
                formData.append('repo_id', options.repositories[keys[i]].id);
                break;
            }
        }
        formData.append('env', options.env);
        formData.append('sesskey', M.cfg.sesskey);
        formData.append('client_id', options.client_id);
        formData.append('savepath', savepath);
        formData.append('ctx_id', options.context.id);
  
        // Insert spinner as a placeholder.
        timestamp = new Date().getTime();
        uploadid = 'moodleimage_' + Math.round(Math.random() * 100000) + '-' + timestamp;
        host.focus();
        host.restoreSelection();
        imagehtml = template({
            url: M.util.image_url("i/loading_small", 'moodle'),
            alt: M.util.get_string('uploading', COMPONENTNAME),
            id: uploadid
        });
        host.insertContentAtFocusPoint(imagehtml);
        self.markUpdated();
  
        // Kick off a XMLHttpRequest.
        xhr.onreadystatechange = function() {
            var placeholder = self.editor.one('#' + uploadid),
                result,
                file,
                newhtml,
                newimage;
  
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    result = JSON.parse(xhr.responseText);
                    if (result) {
                        if (result.error) {
                            if (placeholder) {
                                placeholder.remove(true);
                            }
                            return new M.core.ajaxException(result);
                        }
  
                        file = result;
                        if (result.event && result.event === 'fileexists') {
                            // A file with this name is already in use here - rename to avoid conflict.
                            // Chances are, it's a different image (stored in a different folder on the user's computer).
                            // If the user wants to reuse an existing image, they can copy/paste it within the editor.
                            file = result.newfile;
                        }
  
                        // Replace placeholder with actual image.
                        newhtml = template({
                            url: file.url,
                            presentation: true
                        });
                        newimage = Y.Node.create(newhtml);
                        if (placeholder) {
                            placeholder.replace(newimage);
                        } else {
                            self.editor.appendChild(newimage);
                        }
                        self.markUpdated();
                    }
                } else {
                    Y.use('moodle-core-notification-alert', function() {
                        new M.core.alert({message: M.util.get_string('servererror', 'moodle')});
                    });
                    if (placeholder) {
                        placeholder.remove(true);
                    }
                }
            }
        };
        xhr.open("POST", M.cfg.wwwroot + '/repository/repository_ajax.php?action=upload', true);
        xhr.send(formData);
        return false;
    }
  
  },
  
  /**
  * Handle a click on an image.
  *
  * @method _handleClick
  * @param {EventFacade} e
  * @private
  */
  _handleClick: function(e) {
    var image = e.target;
  
    var selection = this.get('host').getSelectionFromNode(image);
    if (this.get('host').getSelection() !== selection) {
        this.get('host').setSelection(selection);
    }
  },
  
  /**
  * Display the image editing tool.
  *
  * @method _displayDialogue
  * @private
  */
  _displayDialogue: function() {
    // Store the current selection.
    this._currentSelection = this.get('host').getSelection();
    if (this._currentSelection === false) {
        return;
    }
  
    // Reset the image dimensions.
    this._rawImageDimensions = null;
  
    var dialogue = this.getDialogue({
        headerContent: M.util.get_string('imageproperties', COMPONENTNAME),
        width: 'auto',
        focusAfterHide: true,
        focusOnShowSelector: SELECTORS.INPUTURL
    });
  
    // Set the dialogue content, and then show the dialogue.
    dialogue.set('bodyContent', this._getDialogueContent())
            .show();
  },
  
  /**
  * Set the inputs for width and height if they are not set, and calculate
  * if the constrain checkbox should be checked or not.
  *
  * @method _loadPreviewImage
  * @param {String} url
  * @private
  */
  _loadPreviewImage: function(url) {
    var image = new Image();
    var self = this;
  
    image.onerror = function() {
        var preview = self._attoform.one('.' + CSS.IMAGEPREVIEW);
        preview.setStyles({
            'display': 'none'
        });
  
        // Centre the dialogue when clearing the image preview.
        self.getDialogue().centerDialogue();
    };
  
    image.onload = function() {
        var input, currentwidth, currentheight, widthRatio, heightRatio;
  
        self._rawImageDimensions = {
            width: this.width,
            height: this.height
        };
  
        input = self._attoform.one('.' + CSS.IMAGEPREVIEW);
        input.setAttribute('src', this.src);
        input.setStyles({
            'display': 'inline'
        });
  
        self.getDialogue().centerDialogue();
    };
  
    image.src = url;
  },
  
  /**
  * Return the dialogue content for the tool, attaching any required
  * events.
  *
  * @method _getDialogueContent
  * @return {Node} The content to place in the dialogue.
  * @private
  */
  _getDialogueContent: function() {
    var template = Y.Handlebars.compile(TEMPLATE),
        canShowFilepicker = this.get('host').canShowFilepicker('image'),
        content = Y.Node.create(template({
            elementid: this.get('host').get('elementid'),
            CSS: CSS,
            component: COMPONENTNAME,
            showFilepicker: canShowFilepicker,
            alignments: ALIGNMENTS
        }));
   
    this._attoform = content;
  
    // Configure the view of the current image.
    this._applyImageProperties(this._attoform);
  
    this._attoform.one('.' + CSS.INPUTURL).on('blur', this._urlChanged, this);
    this._attoform.one('.' + CSS.INPUTURL).on('blur', this._urlChanged, this);
    this._attoform.one('.' + CSS.INPUTSUBMIT).on('click', this._setImage, this);
  
     if (canShowFilepicker) {
          content.delegate('click', function(e) {
              var element = this._attoform;
              e.preventDefault();
              this.get('host').showFilepicker('image', this._getFilepickerCallback(element), this);
          }, '.atto_responsiveimage_openimagebrowser', this);
     }
  
    return content;
  },
  
  /**
  * Update the dialogue after an image was selected in the File Picker.
  *
  * @method _filepickerCallback
  * @param {object} params The parameters provided by the filepicker
  * containing information about the image.
  * @private
  */
  _filepickerCallback: function(params) {
    if (params.url !== '') {
        var input = this._attoform.one('.' + CSS.INPUTURL);
        input.set('value', params.url);
  
        // Load the preview image.
        this._loadPreviewImage(params.url);
    }
  },
  
  /**
       * Returns the callback for the file picker to call after a file has been selected.
       *
       * @method _getFilepickerCallback
       * @param  {Y.Node} element The element which triggered the callback (atto form)
       * @return {Function} The function to be used as a callback when the file picker returns the file
       * @private
       */
      _getFilepickerCallback: function(element) {
          return function(params) {
              if (params.url !== '') {
                  var input = element.one('.' + CSS.INPUTURL);
                  input.set('value', params.url);
  
                  // Load the preview image.
                  var image = new Image();
  
                  image.onerror = function() {
                      var preview = element.one('.' + CSS.IMAGEPREVIEW);
                      preview.setStyles({
                          'display': 'none'
                      });
                  };
  
                  image.onload = function() {
                      var input;
  
                      input = element.one('.' + CSS.IMAGEPREVIEW);
                      input.setAttribute('src', this.src);
                      input.setStyles({
                          'display': 'inline'
                      });
  
                  };
  
                  image.src = params.url;
              }
          };
      },
  
  /**
  * Applies properties of an existing image to the image dialogue for editing.
  *
  * @method _applyImageProperties
  * @param {Node} form
  * @private
  */
  _applyImageProperties: function(form) {
    var properties = this._getSelectedImageProperties(),
        img = form.one('.' + CSS.IMAGEPREVIEW);
  
    if (properties === false) {
        img.setStyle('display', 'none');
        // Set the default alignment.
        ALIGNMENTS.some(function(alignment) {
            if (alignment.isDefault) {
                //form.one('.' + CSS.INPUTALIGNMENT).set('value', alignment.value);
                return true;
            }
  
            return false;
        }, this);
  
        return;
    }
  
    if (properties.align) {
        form.one('.' + CSS.INPUTALIGNMENT).set('value', properties.align);
    }
    if (properties.customstyle) {
        form.one('.' + CSS.INPUTCUSTOMSTYLE).set('value', properties.customstyle);
    }
  
    if (properties.src) {
        form.one('.' + CSS.INPUTURL).set('value', properties.src);
        this._loadPreviewImage(properties.src);
    }
  },
  
  /**
  * Gets the properties of the currently selected image.
  *
  * The first image only if multiple images are selected.
  *
  * @method _getSelectedImageProperties
  * @return {object}
  * @private
  */
  _getSelectedImageProperties: function() {
    var properties = {
            src: null,
            alt: null,
            align: '',
            presentation: false
        },
  
        // Get the current selection.
        images = this.get('host').getSelectedNodes(),
        style,
        image;
  
    if (images) {
        images = images.filter('img');
    }
  
    if (images && images.size()) {
        image = this._removeLegacyAlignment(images.item(0));
        this._selectedImage = image;
  
        style = image.getAttribute('style');
        properties.customstyle = style;
  
        this._getAlignmentPropeties(image, properties);
        properties.src = image.getAttribute('src');
        properties.presentation = (image.get('role') === 'presentation');
        return properties;
    }
  
    // No image selected - clean up.
    this._selectedImage = null;
    return false;
  },
  
  /**
  * Sets the alignment of a properties object.
  *
  * @method _getAlignmentPropeties
  * @param {Node} image The image that the alignment properties should be found for
  * @param {Object} properties The properties object that is created in _getSelectedImageProperties()
  * @private
  */
  _getAlignmentPropeties: function(image, properties) {
    var complete = false,
        defaultAlignment;
  
    // Check for an alignment value.
    complete = ALIGNMENTS.some(function(alignment) {
        var classname = this._getAlignmentClass(alignment.value);
        if (image.hasClass(classname)) {
            properties.align = alignment.value;
            Y.log('Found alignment ' + alignment.value, 'debug', 'atto_responsiveimage-button');
  
            return true;
        }
  
        if (alignment.isDefault) {
            defaultAlignment = alignment.value;
        }
  
        return false;
    }, this);
  
    if (!complete && defaultAlignment) {
        properties.align = defaultAlignment;
    }
  },
  
  /**
  * Update the form when the URL was changed. This includes updating the
  * height, width, and image preview.
  *
  * @method _urlChanged
  * @private
  */
  _urlChanged: function() {
    var input = this._attoform.one('.' + CSS.INPUTURL);
  
    if (input.get('value') !== '') {
        // Load the preview image.
        this._loadPreviewImage(input.get('value'));
    }
  },
  
  /**
  * Update the image in the contenteditable.
  *
  * @method _setImage
  * @param {EventFacade} e
  * @private
  */
  _setImage: function(e) {
    var form = this._attoform,
        url = form.one('.' + CSS.INPUTURL).get('value'),
        alignment = this._getAlignmentClass(form.one('.' + CSS.INPUTALIGNMENT).get('value')),
        imagehtml,
        customstyle = form.one('.' + CSS.INPUTCUSTOMSTYLE).get('value'),
        classlist = [],
        host = this.get('host');
  
    e.preventDefault();
  
    // Check if there are any accessibility issues.
    if (this._updateWarning()) {
        return;
    }
  
    // Focus on the editor in preparation for inserting the image.
    host.focus();
    if (url !== '') {
        if (this._selectedImage) {
            host.setSelection(host.getSelectionFromNode(this._selectedImage));
        } else {
            host.setSelection(this._currentSelection);
        }
  
        // Add the alignment class for the image.
        classlist.push(alignment);
  
        var template = Y.Handlebars.compile(IMAGETEMPLATE);
        imagehtml = template({
            url: url,
            customstyle: customstyle,
            classlist: classlist.join(' ')
        });
  
        this.get('host').insertContentAtFocusPoint(imagehtml);
  
        this.markUpdated();
    }
  
    this.getDialogue({
      focusAfterHide: null
    }).hide();
  
  },
  
  /**
  * Removes any legacy styles added by previous versions of the atto image button.
  *
  * @method _removeLegacyAlignment
  * @param {Y.Node} imageNode
  * @return {Y.Node}
  * @private
  */
  _removeLegacyAlignment: function(imageNode) {
    if (!imageNode.getStyle('margin')) {
        // There is no margin therefore this cannot match any known alignments.
        return imageNode;
    }
  
    ALIGNMENTS.some(function(alignment) {
        if (imageNode.getStyle(alignment.name) !== alignment.value) {
            // The name/value do not match. Skip.
            return false;
        }
  
        var normalisedNode = Y.Node.create('<div>');
        normalisedNode.setStyle('margin', alignment.margin);
        if (imageNode.getStyle('margin') !== normalisedNode.getStyle('margin')) {
            // The margin does not match.
            return false;
        }
  
        Y.log('Legacy alignment found and removed.', 'info', 'atto_responsiveimage-button');
        imageNode.addClass(this._getAlignmentClass(alignment.value));
        imageNode.setStyle(alignment.name, null);
        imageNode.setStyle('margin', null);
  
        return true;
    }, this);
  
    return imageNode;
  },
  
  _getAlignmentClass: function(alignment) {
    return CSS.ALIGNSETTINGS + '_' + alignment;
  },
  
  /**
  * Update the alt text warning live.
  *
  * @method _updateWarning
  * @return {boolean} whether a warning should be displayed.
  * @private
  */
  _updateWarning: function() {
          return false;
  }
  });
  

}, '@VERSION@', {"requires": ["moodle-editor_atto-plugin"]});
