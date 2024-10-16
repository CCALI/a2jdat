import CanMap from 'can-map'

import 'can-route'
import 'can-map-define'
import 'can-route-pushstate'
import '@caliorg/a2jdeps/elements/a2j-template-ssr/'

const Body = CanMap.extend({
  define: {
    // passed to a2j-template-ssr-vm.js
    templateIds: {
      type: '*'
    },
    fileDataUrl: {
      type: 'string',
      value: ''
    },
    answers: {},
    guideId: {},
    templateId: {}
  }
})

const Request = CanMap.extend({
  define: {
    body: {
      Type: Body
    }
  }
})

const AppViewModel = CanMap.extend('ServerAppViewModel', {
  define: {
    request: {
      Type: Request
    },

    title: {
      serialize: false,
      value: 'A2J document preview'
    }
  }
})

export default AppViewModel
