import Ember from 'ember';

const {
  A,
  Component,
  computed,
  isEmpty,
  isNone,
  run: { later, scheduleOnce },
  inject,
  $
} = Ember;

export default Component.extend({
  classNames: ['container-fluid'],
  elementId: 'hue-controls',
  lightsData: null,

  activeLights: A(),
  tabList: ["Lights", "Music"],
  selectedTab: 1,
  pauseLightUpdates: false,

  displayFailure: true,

  notify: inject.service(),

  dimmerOnClass: computed('dimmerOn', function () {
    return this.get('dimmerOn') ? 'dimmerOn md-menu-origin' : 'md-menu-origin';
  }),

  ready: computed('lightsData', 'trial', function () {
    return this.get('trial') || !isNone(this.get('lightsData'));
  }),

  apiURL: computed('bridgeIp', 'bridgeUsername', function () {
    return 'http://' + this.get('bridgeIp') + '/api/' + this.get('bridgeUsername');
  }),

  tabData: computed('tabList', 'selectedTab', function () {
    let tabData = [], selectedTab = this.get('selectedTab');

    this.get('tabList').forEach(function (tab, i) {
      let selected = false;

      if (i === selectedTab) {
        selected = true;
      }

      tabData.push({ "name": tab, "selected": selected });
    });

    return tabData;
  }),

  didInsertElement() {
    // here's a weird way to automatically initialize bootstrap tooltips
    let observer = new MutationObserver(function (mutations) {
      let haveTooltip = !mutations.every(function (mutation) {
        return isEmpty(mutation.addedNodes) || isNone(mutation.addedNodes[0].classList) || mutation.addedNodes[0].classList.contains('tooltip');
      });

      if (haveTooltip) {
        scheduleOnce('afterRender', function () {
          $('.bootstrap-tooltip').tooltip();
        });
      }
    });

    observer.observe($('#hue-controls')[0], { childList: true, subtree: true });
  },

  init() {
    this._super(...arguments);

    if (!this.get('trial')) {
      this.updateLightData();
      setInterval(this.updateLightData.bind(this), 2000);
    }

    if (!isNone(this.get('storage').get('huegasm.selectedTab'))) {
      this.set('selectedTab', this.get('storage').get('huegasm.selectedTab'));
    }
  },

  updateLightData() {
    let fail = () => {
      if (isNone(this.get('lightsData'))) {
        this.send('clearBridge');
      } else if (this.get('displayFailure')) {
        this.get('notify').warning({ html: '<div class="alert alert-warning" role="alert">Error retrieving data from your lights. Yikes.</div>' });
        this.set('displayFailure', false);

        later(this, function () {
          this.set('displayFailure', true);
        }, 30000);
      }
    };

    if (!this.get('pauseLightUpdates')) {
      $.get(this.get('apiURL') + '/lights', (result, status) => {
        if (!isNone(result[0]) && !isNone(result[0].error)) {
          fail();
        } else if (status === 'success' && JSON.stringify(this.get('lightsData')) !== JSON.stringify(result)) {
          this.set('lightsData', result);
        }
      }).fail(fail);
    }
  },

  actions: {
    changeTab(tabName) {
      let index = this.get('tabList').indexOf(tabName);
      this.set('selectedTab', index);
      this.get('storage').set('huegasm.selectedTab', index);
    },
    clearBridge() {
      let storage = this.get('storage');
      storage.remove('huegasm.bridgeUsername');
      storage.remove('huegasm.bridgeIp');
      location.reload();
    },
    toggleDimmer() {
      this.sendAction('toggleDimmer');
    },
    toggleLightsIcons() {
      this.sendAction('toggleLightsIcons');
    },
    clearAllSettings() {
      this.get('storage').clear();
      location.reload();
    },
    startIntro() {
      let intro = introJs(),
        playerBottom = $('#player-bottom');

      if (this.get('dimmerOn')) {
        this.send('toggleDimmer');
      }

      intro.setOptions({
        steps: [
          {
            intro: 'Welcome! This short tutorial will introduce you to Huegasm.'
          },
          {
            element: '#music-tab',
            intro: 'This is the music player. You\'ll use this to play music and synchronize it with your active lights.<br><br>' +
            '<i><b>TIP</b>: Control which lights are active through the <b>Lights</b> tab.</i>'
          },
          {
            element: '#playlist',
            intro: 'You can add and select music to play from your playlist here. You may listen to local audio files, stream music from soundcloud or stream directly from a connected microphone.<br><br>' +
            '<i><b>TIP</b>: Songs added through Soundcloud will be saved for when you visit this page again.</i>'
          },
          {
            element: $('#playlist md-menu')[0],
            intro: '<img src="/assets/images/soundcloudUrl.png" id="soundcloud-tutorial">You can add songs from SoundCloud by copy and pasting the URL shown here'
          },
          {
            element: '#player-area',
            intro: 'The audio playback may be controlled with the controls here. Basic music visualization effects may be shown here by selecting them from the menu ( eyeball icon in the bottom right ).'
          },
          {
            element: '#beat-option-row',
            intro: 'These are the settings for the music tab:<br>' +
            '<b>Sensitivity</b> - The sensitivity of the beat detector ( more sensitivity results in more registered beats )<br>' +
            '<b>Hue Range</b> - The hue range that the lights may change to on beat.<br>' +
            '<b>Brightness Range</b> - The minimum ( off-beat ) and maximum ( on-beat ) brightness of the lights.<br>' +
            '<b>Flashing Transitions</b> - Quickly flash the lights on beat<br>' +
            '<b>Colorloop</b> - Slowly cycle the lights through all the colors while the music is playing<br>' +
            '<i><b>TIP</b>: Your sensitivity settings are saved per song as indicated by the red star icon in the top left corner. These settings they will be restored if you ever listen to the same song again.</i>',
            position: 'top'
          },
          {
            element: '#beat-container',
            intro: 'An interactive speaker that will bump when a beat is registered. <br><br>' +
            '<i><b>TIP</b>: Click on the center of the speaker to simulate a beat.</i>',
            position: 'top'
          },
          {
            element: '#lights-tab',
            intro: 'This is the lights tab. Here you\'ll be able to change various light properties:<br>' +
            '<b>Power</b> - Turn the selected lights on/off<br>' +
            '<b>Brightness</b> - The brightness level of the selected lights<br>' +
            '<b>Color</b> - The color of the selected lights<br>' +
            '<b>Strobe</b> - Selected lights will flash in sequential order<br>' +
            '<b>Colorloop</b> - Selected lights will slowly cycle through all the colors<br>'
          },
          {
            element: '#active-lights',
            intro: 'These icons represent the hue lights in your system. Active lights will be controlled by the application while the inactive lights will have a red X over them and will not be controlled.<br>' +
            'You may toggle a light\'s state by clicking on it.'
          },
          {
            element: $('#navigation .ember-basic-dropdown-trigger')[0],
            intro: 'A few miscellaneous settings can be found here.<br><br>' +
            '<b>WARNING</b>: clearing application settings will restore the application to its original state. This will even delete your playlist and any saved song beat preferences.'
          },
          {
            intro: 'And that\'s it...Hope you enjoy the application. ;)'
          }
        ]
      });

      intro.onexit(() => {
        $('body').velocity('scroll', { duration: 200 });
      });

      intro.onchange((element) => {
        if (element.id === '' || element.id === 'music-tab' || element.id === 'playlist' || element.id === 'player-area' || element.id === 'beat-option-row' || element.id === 'beat-option-button-group' || element.id === 'beat-container' || element.id === 'using-mic-audio-tooltip' || element.nodeName === 'MD-MENU') {
          $('.navigation-item').eq(1).click();
        } else {
          $('.navigation-item').eq(0).click();
        }

        if (element.id === 'music-tab' || element.id === 'playlist' || element.id === 'player-area') {
          playerBottom.hide();
        } else if (element.id === 'beat-option-row' || element.id === 'beat-option-button-group' || element.id === 'beat-container') {
          playerBottom.show();
        } else if (element.id === 'dimmer') {
          $(document).click();
        }
      });

      // skip hidden/missing elements
      intro.onafterchange((element) => {
        let elem = $(element);
        if (elem.html() === '<!---->') {
          $('.introjs-nextbutton').click();
        }

        if (element.id === '') {
          later(this, () => {
            $('body').velocity('scroll');
          }, 500);
        } else {
          later(this, () => {
            $('.introjs-tooltip').velocity('scroll', { offset: -100 });
          }, 500);
        }
      }).start();
    }
  }
});