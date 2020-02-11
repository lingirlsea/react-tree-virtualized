
let guid = 10000
let treeData = Array(4).fill({})

treeData.forEach(data => {
  data.id = guid++
  data.children = []

  for(var i = 0; i < 10000; i++) {
    data.children.push({
      id: guid++,
      title: data.title + '-' + i
    })
  }
})

treeData.unshift({
  id: 0,
  title: 'X',
  children: [
    {
      id: 1,
      title: 'X-0',
      children: [
        {
          id: 2,
          title: 'X-0-0',
          children: [
            {
              id: 3,
              title: 'X-0-0-0',
            }, {
              id: 4,
              title: 'X-0-0-1',
            }
          ]
        },
        {
          id: 7,
          title: 'X-0-1',
          children: [{
            id: 8,
            title: 'X-0-1-0',
          }, {
            id: 9,
            title: 'X-0-1-1',
          }]
        },
        {
          id: 5,
          title: 'X-0-2',
        }
      ]
    },
    {
      id: 6,
      title: 'X-1',
    }
  ]
})

export { treeData }
