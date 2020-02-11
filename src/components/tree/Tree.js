import React from 'react';
import classNames from 'classnames';
import { Icon, Checkbox } from 'antd';
import { VariableSizeList as List } from 'react-window';
import './Tree.scss';

/**
 * 支持复选框，异步加载，点击事件，自动展开
 * 
 * 
 */

const noop = function() {}

export default class VirtualizedTree extends React.PureComponent {
  static defaultProps = {
    width: '',
    height: 400,
    treeData: [],
    checkable: false,
    showLine: false,
    defaultExpandedKeys: [],
    defaultCheckedKeys: [],
    defaultExpandAll: false,
    className: '',
    onTreeNode: () => {
      return {
        onClick: noop,
        onDoubleClick: noop,
      }
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      list: [],
      selectedTreeNodeId: -1,
      expandedKeys: [...props.defaultExpandedKeys],
      checkedKeys: [],
    }

    // 
    this.treeData = this.formatTreeData(props.treeData, [...props.defaultCheckedKeys])
  }

  componentDidMount() {
    let {
      defaultExpandAll,
      defaultExpandedKeys,
    } = this.props

    if (defaultExpandAll) {
      this.expandedKeys = Object.keys(this.treeData)
    }

    // Handle the root node separately
    if(defaultExpandedKeys.length === 1 && defaultExpandedKeys[0] === '0') {
      this.expandedKeys = this.treeData['0'].map(node => node._childKey)
    }

    let state = {
      expandedKeys: this.expandedKeys,
      list: this.getList(this.expandedKeys)
    }

    if(this.defaultCheckedTreeNodes.length) {
      // Do `NOT` use defaultCheckedKeys prop, exclude the node which NOT in the tree
      state.checkedKeys = this.defaultCheckedTreeNodes.map(node => node.id)
    }

    this.setState(state, () => {
      // Simulate click event
      this.onCheckboxChange(this.defaultCheckedTreeNodes, true)
    })
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.treeData = this.formatTreeData(nextProps.treeData, [...nextProps.defaultCheckedKeys])
    // Retrigger the selection of the node
    this.onCheckboxChange(this.defaultCheckedTreeNodes, true)
    // When the source data is changed, the nodes which expanded will keep
    const expandedKeys = this.state.expandedKeys.filter(key => this.treeData[key])

    this.setState({
      expandedKeys,
      list: this.getList(expandedKeys),
    })
  }

  render() {
    const { list, expandedKeys, checkedKeys, selectedTreeNodeId } = this.state
    const {
      width,
      height,
      treeNode,
      treeNodeHeight,
      showLine,
      checkable,
      className,
    } = this.props

    const Row = ({ index, style }) => {
      let node = list[index]

      return (
        <div
          className="TreeNode"
          style={style}
        >
          {[...Array(node._indent)].map((_, index) => {
            return (
              <div
                key={index}
                className={classNames('ParentNode-Line', showLine && 'Show' )}
                style={{ height: treeNodeHeight }}>
                <i className="Gutter" style={{
                  top: treeNodeHeight,
                  height: (treeNodeHeight - 24) / 2,
                }}></i>
              </div>
            )
          })}
          <div className="TreeNode-Icon-Wrapper">
            {/* handle line for last leaf node */}
            {showLine && !node._last &&
              <div className="LeafNode-Line" style={{ height: treeNodeHeight - 24 }}></div>
            }
            {node._childKey
              ? <Icon
                  type={expandedKeys.includes(node._childKey) ? 'caret-down' : 'caret-right'}
                  onClick={(e) => this.handleTreeNodeIconClick(node, index, e)}
                />
              : <Icon type="profile" />
            }
          </div>
          {checkable &&
            <Checkbox
              className="Checkbox"
              indeterminate={this.indeterminate(node)}
              checked={checkedKeys.includes(node.id)}
              onChange={e => this.onCheckboxChange([node], e)}
            />
          }
          <div
            className={classNames(
              'Text',
              { 'Selected': node.id === selectedTreeNodeId }
            )}
            onClick={e => this.handleTreeNodeTextClick(node, index, e)}
            onDoubleClick={e => this.handleTreeNodeTextDoubleClick(node, index, e)}
          >
            {treeNode(node)}
          </div>
        </div>
      )
    };

    return (
      <List
        className={classNames('Tree-Virtualized', className)}
        width={width}
        height={height}
        itemCount={list.length}
        itemSize={index => treeNodeHeight}
      >
        {Row}
      </List>
    )
  }

  treeNodeStyle = (style, node) => {
    if(this.props.showLine) {
      return 
    }

    return {...style, marginLeft: 20*node._indent}
  }

  formatTreeData = (treeData, defaultCheckedKeys) => {
    const { checkable, showLine } = this.props
    let ret = {}
    
    // Transform treeNodes id into a specific structure, for example: [1, 2] -> ['0-0', '0-1']
    this.expandedKeys = []
    this.realExpandedKeys = []

    this.flattenTreeData = {}
    this.leafTreeNodesId = []
    this.defaultCheckedTreeNodes = []
    
    const $ = (data, prefix = '0', parentId = '') => {
      data.forEach((item, index) => {
        const { children, ...rest } = item
        this.flattenTreeData[item.id] = rest

        let tmp = {
          id: item.id,
          title: item.title,
          // Count the number of child nodes when the node is collapsed
          _selfKey: prefix,
          _indent: prefix.replace(/\d/g, '').length,
        }

        if (checkable) {
          tmp._parentId = parentId
        }

        if(item.children) {
          let childKey = prefix + '-' + index
          tmp._childKey = childKey

          if (checkable) {
            // -1 -> not checked
            //  0 -> half checked
            //  1 -> checked
            tmp._checkStatus = -1
          }

          if (this.state.expandedKeys.includes(item.id)) {
            this.expandedKeys.push(childKey)
            this.realExpandedKeys.push(item.id)
          }

          $(item.children, childKey, item.id)
        } else {

          this.leafTreeNodesId.push(item.id)
        }

        if(defaultCheckedKeys.length) {
          let index = defaultCheckedKeys.findIndex(key => key === item.id)
          if(index > -1) {
            this.defaultCheckedTreeNodes.push(tmp)
            defaultCheckedKeys.splice(index, 1)
          }
        }

        ret[prefix] = ret[prefix] || []
        ret[prefix].push(tmp)
      })
    }

    $(treeData)
    // mark the level's last node, use for prop `showLine`
    if(showLine) {
      Object.keys(ret).forEach(key => {
        let item = ret[key]
        item[item.length - 1]._last = true
      })
    }
    
    console.log(ret);
    return ret
  }

  getList = (expandedKeys = []) => {
    let initList = this.treeData['0']

    if (!expandedKeys.length) {
      return initList
    }

    expandedKeys.sort((a, b) => a.length - b.length)
    const minLength = expandedKeys[0].replace(/\d/g, '').length,
      maxLength = expandedKeys[expandedKeys.length - 1].replace(/\d/g, '').length,
      classifiedNodes = []

    for(let i = minLength; i < maxLength + 1; i++) {
      classifiedNodes.push(expandedKeys.filter(key => i === key.replace(/\d/g, '').length))
    }

    const $ = (treeNodes) => {
      // console.log(treeNodes);
      treeNodes.forEach(node => {
        const index = initList.findIndex(el => el._childKey === node)
        
        if (index > -1) {
          initList.splice(index + 1, 0, ...this.treeData[node])
        } else {
          let tmp = []
          node.split('-').reduce((accumulator, currentValue) => {
            const string = accumulator + '-' + currentValue
            tmp.push(string)
            return string
          })

          if(tmp.length) {
            this.setState(state => {
              tmp.forEach(item => {
                if (!state.expandedKeys.includes(item)) {
                  state.expandedKeys.push(item)
                }
              })
              return {
                expandedKeys: [...state.expandedKeys]
              }
            })

            $(tmp)
          }
        }
      })
    }

    classifiedNodes.forEach($)
    return initList
  }

  indeterminate = node => {
    return node._checkStatus === 0
  }

  onCheckboxChange = (nodes, event) => {
    if(!this.props.checkable) {
      return
    }

    const checked = typeof event === 'boolean' ? event : event.target.checked
    // use `Set` to improve performance, Chrome > 38
    let checkedKeys = new Set([...this.state.checkedKeys])

    const updateParentNodeCheckStatus = (node, checkStatus) => {
      node._checkStatus = checkStatus
      checkedKeys.delete(node.id)

      if(node._parentId === '') {
        return
      }

      const parentKey = node._selfKey.split('-').slice(0, -1).join('-')
      const parentNode = this.treeData[parentKey].filter(item => item.id === node._parentId)[0]
      updateParentNodeCheckStatus(parentNode, checkStatus)
    }

    // if all peer ndoes are selected
    // recursively check whether all peer nodes of parent node are selected
    // and so on, up to the root node
    const loop = (node) => {
      if(checked) {
        checkedKeys.add(node.id)
        
        // handle child nodes
        if(node._childKey) {
          node._checkStatus = 1

          Object.keys(this.treeData)
            .filter(key => key.startsWith(node._childKey))
            .forEach(key => {
              this.treeData[key].forEach(item => {
                if(item._childKey !== undefined) {
                  item._checkStatus = 1
                }

                checkedKeys.add(item.id)
              })
            })
        }

        if(node._parentId === '') {
          return
        }

        // handle parent node, all parent nodes of the current node are checked or half-checked
        const allChecked = this.treeData[node._selfKey].every(node => checkedKeys.has(node.id))
        const parentKey = node._selfKey.split('-').slice(0, -1).join('-')
        const parentNode = this.treeData[parentKey].filter(item => item.id === node._parentId)[0]

        allChecked ? loop(parentNode) : updateParentNodeCheckStatus(parentNode, 0)

      } else {
        checkedKeys.delete(node.id)

        // handle child node
        if(node._childKey) {
          node._checkStatus = -1

          Object.keys(this.treeData)
            .filter(key => key.startsWith(node._childKey))
            .forEach(key => {
              this.treeData[key].forEach(item => {
                if(item._childKey !== undefined) {
                  item._checkStatus = -1
                }

                checkedKeys.delete(item.id)
              })
            })
        }

        if(node._parentId === '') {
          return
        }

        // handle parent node, all parent nodes of the current node are not-checked or half-checked
        const hasChecked = this.treeData[node._selfKey].some(node => {
          if(node._checkStatus !== undefined) {
            return node._checkStatus === 0 || checkedKeys.has(node.id)
          }
          
          return checkedKeys.has(node.id)
        })
        const parentKey = node._selfKey.split('-').slice(0, -1).join('-')
        const parentNode = this.treeData[parentKey].filter(item => item.id === node._parentId)[0]

        hasChecked ? updateParentNodeCheckStatus(parentNode, 0) : loop(parentNode)
      }
    }

    nodes.forEach(node => loop(node))
    // Switch Set to Array
    checkedKeys = [...checkedKeys]

    const { onCheck } = this.props
    // default checked will not trigger onCheck event
    if(onCheck && nodes.length === 1 && typeof event === 'object') {
      const checkedNodes = checkedKeys.map(key => this.flattenTreeData[key])
      onCheck(checkedKeys, {
        checked,
        checkedNodes,
        node: this.flattenTreeData[nodes[0].id],
        // not support yet
        // halfCheckedNodes: [],
      })
    }

    this.setState({ checkedKeys })
  }

  handleTreeNodeIconClick = (node, index, e) => {
    e.stopPropagation()

    let { list, expandedKeys } = this.state

    if(node._childKey) {
      const $index = expandedKeys.findIndex(el => el === node._childKey)
      
      if ($index === -1) {
        let child = node._cache || this.treeData[node._childKey]

        list.splice(index + 1, 0, ...child)
        expandedKeys.push(node._childKey)
        this.realExpandedKeys.push(node.id)
        
      } else {
        let front = list.slice(0, index + 1),
          end = list.slice(index + 1),
          result = end.filter(item => item._selfKey.startsWith(node._childKey))

        node._cache = result
        list = [...front, ...end.slice(result.length)]
        expandedKeys.splice($index, 1)
        this.realExpandedKeys.splice($index, 1)
      }

      const { onExpand } = this.props
      if(onExpand) {
        onExpand(
          this.realExpandedKeys,
          {
            expanded: $index === -1,
            node: this.flattenTreeData[node.id],
            // leafExpandedKeys: this.leafTreeNodesId,
          }
        )
      }

      this.setState({ list, expandedKeys: [...expandedKeys] })
    }
  }

  handleTreeNodeTextClick = (node, index, e) => {
    this.props.onTreeNode(node).onClick(e)
    this.setState({ selectedTreeNodeId: node.id })
  }

  handleTreeNodeTextDoubleClick = (node, index, e) => {
    this.props.onTreeNode(node).onDoubleClick(e)
  }
}