import StringBuffer from 'discourse/mixins/string-buffer';

export default Em.Component.extend(StringBuffer, {
  tagName: 'section',
  classNameBindings: [':post-actions', 'hidden'],
  actionsHistory: Em.computed.alias('post.actionsHistory'),
  emptyHistory: Em.computed.empty('actionsHistory'),
  hidden: Em.computed.and('emptyHistory', 'post.notDeleted'),

  rerenderTriggers: ['actionsHistory.@each', 'actionsHistory.users.length', 'post.deleted'],

  // This was creating way too many bound ifs and subviews in the handlebars version.
  renderString(buffer) {
    if (!this.get('emptyHistory')) {
      this.get('actionsHistory').forEach(function(c) {
        buffer.push("<div class='post-action'>");

        const renderActionIf = function(property, dataAttribute, text) {
          if (!c.get(property)) { return; }
          buffer.push(" <span class='action-link " + dataAttribute  +"-action'><a href='#' data-" + dataAttribute + "='" + c.get('id') + "'>" + text + "</a>.</span>");
        };

        // TODO multi line expansion for flags
        let iconsHtml = "";
        if (c.get('usersExpanded')) {
          let postUrl;
          c.get('users').forEach(function(u) {
            iconsHtml += "<a href=\"" + Discourse.getURL("/users/") + u.get('username_lower') + "\" data-user-card=\"" + u.get('username_lower') + "\">";
            if (u.post_url) {
              postUrl = postUrl || u.post_url;
            }
            iconsHtml += Discourse.Utilities.avatarImg({
              size: 'small',
              avatarTemplate: u.get('avatarTemplate'),
              title: u.get('username')
            });
            iconsHtml += "</a>";
          });

          let key = 'post.actions.people.' + c.get('actionType.name_key');
          if (postUrl) { key = key + "_with_url"; }

          // TODO postUrl might be uninitialized? pick a good default
          buffer.push(" " + I18n.t(key, { icons: iconsHtml, postUrl: postUrl}) + ".");
        }
        renderActionIf('usersCollapsed', 'who-acted', c.get('description'));
        renderActionIf('canAlsoAction', 'act', I18n.t("post.actions.it_too." + c.get('actionType.name_key')));
        renderActionIf('can_undo', 'undo', I18n.t("post.actions.undo." + c.get('actionType.name_key')));
        renderActionIf('can_defer_flags', 'defer-flags', I18n.t("post.actions.defer_flags", { count: c.count }));

        buffer.push("</div>");
      });
    }

    const post = this.get('post');
    if (post.get('deleted')) {
      buffer.push("<div class='post-action'>" +
                  "<i class='fa fa-trash-o'></i>&nbsp;" +
                  Discourse.Utilities.tinyAvatar(post.get('postDeletedBy.avatar_template'), {title: post.get('postDeletedBy.username')}) +
                  Discourse.Formatter.autoUpdatingRelativeAge(new Date(post.get('postDeletedAt'))) +
                  "</div>");
    }
  },

  actionTypeById(actionTypeId) {
    return this.get('actionsHistory').findProperty('id', actionTypeId);
  },

  click(e) {
    const $target = $(e.target);
    let actionTypeId;

    const post = this.get('post');

    if (actionTypeId = $target.data('defer-flags')) {
      this.actionTypeById(actionTypeId).deferFlags(post);
      return false;
    }

    // User wants to know who actioned it
    if (actionTypeId = $target.data('who-acted')) {
      this.actionTypeById(actionTypeId).loadUsers(post);
      return false;
    }

    if (actionTypeId = $target.data('act')) {
      this.get('actionsHistory').findProperty('id', actionTypeId).act(post);
      return false;
    }

    if (actionTypeId = $target.data('undo')) {
      this.get('actionsHistory').findProperty('id', actionTypeId).undo(post);
      return false;
    }

    return false;
  }
});
