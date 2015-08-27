import Em from 'ember';

export default Em.Component.extend({

  actions: {
    clickLight: function(id, data){
      this.sendAction('action', id, data);
    },
    lightStartHover: function(id){
      var hoveredLight = this.get('lightsList').filter(function(light){
        return light.activeClass !== 'unreachable' && light.id === id[0];
      });

      if(!Em.isEmpty(hoveredLight) && this.get('noHover') !== true){
        Em.$.ajax(this.get('apiURL')  + '/lights/' + id + '/state', {
          data: JSON.stringify({"alert": "lselect"}),
          contentType: 'application/json',
          type: 'PUT'
        });
      }
    },
    lightStopHover: function(id){
      var hoveredLight = this.get('lightsList').filter(function(light){
        return light.activeClass !== 'unreachable' && light.id === id[0];
      });

      if(!Em.isEmpty(hoveredLight) && this.get('noHover') !== true){
        Em.$.ajax(this.get('apiURL')  + '/lights/' + id + '/state', {
          data: JSON.stringify({"alert": "none"}),
          contentType: 'application/json',
          type: 'PUT'
        });
      }
    }
  },

  classNames: ['lightGroup'],

  // list of all the lights in the hue system
  lightsList: function(){
    var lightsData = this.get('lightsData'), lightsList = [], type;
    for (var key in lightsData) {
      if (lightsData.hasOwnProperty(key)) {
        switch(lightsData[key].modelid){
          case 'LCT001':
            type = 'a19';
            break;
          case 'LCT002':
            type = 'br30';
            break;
          case 'LCT003':
            type = 'gu10';
            break;
          case 'LST001':
            type = 'lightstrip';
            break;
          case 'LLC010':
            type = 'lc_iris';
            break;
          case 'LLC011':
            type = 'lc_bloom';
            break;
          case 'LLC012':
            type = 'lc_bloom';
            break;
          case 'LLC006':
            type = 'lc_iris';
            break;
          case 'LLC007':
            type = 'lc_aura';
            break;
          case 'LLC013':
            type = 'storylight';
            break;
          case 'LWB004':
            type ='a19';
            break;
          case 'LLC020':
            type = 'huego';
            break;
          default:
            type = 'a19';
        }

        var activeClass = 'active';

        if(!this.get('activeLights').contains(key)){
          activeClass = 'inactive';
        } else if(!lightsData[key].state.reachable){
          activeClass = 'unreachable';
        }

        lightsList.push({type: type, name: lightsData[key].name, id: key, data: lightsData[key], activeClass: activeClass});
      }
    }

    return lightsList;
  }.property('lightsData', 'activeLights.[]')
});