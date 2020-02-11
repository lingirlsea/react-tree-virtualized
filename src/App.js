import React from 'react';
import { Button, Tree } from 'antd';
import AntdTreeDemo from './AntdTree';
import VirtualizedTree from './components/tree/Tree';
import './App.css';
import { treeData } from './data';

const { TreeNode, DirectoryTree } = Tree;

class App extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      defaultCheckedKeys: [3],
      defaultExpandedKeys: [0, 1, 2],
      treeData: treeData,
    }
  }

  render() {
    const {
      defaultCheckedKeys,
      defaultExpandedKeys,
      treeData,
    } = this.state
    
    return (
      <div className="App">
        <div>
          <Button onClick={this.handleClick}>Button</Button>
        </div>
        <br />
        <VirtualizedTree
          className="my-classname"
          width="100%"
          height={300}
          treeNodeHeight={32}
          checkable={true}
          showLine={true}
          defaultCheckedKeys={defaultCheckedKeys}
          defaultExpandedKeys={defaultExpandedKeys}
          treeData={treeData}
          onExpand={this.onExpand}
          onCheck={this.onCheck}
          treeNode={this.treeNode}
          onTreeNode={this.onTreeNode}
        />
        {/* <Demo /> */}
        {/* <AntdTreeDemo /> */}
      </div>
    );
  }

  handleClick = () => {
    this.setState({
      treeData: [...treeData],
      defaultCheckedKeys: [4, 20, 21],
    })
  }

  treeNode = node => {
    return node.id
  }

  onTreeNode = node => {
    return {
      onClick: event => {
        console.log(node.id, 'Click')
      },
      onDoubleClick: event => {
        console.log(node.id, 'DoubleClick')
      },
    }
  }

  onCheck = (checkedKeys, object) => {
    console.log(checkedKeys, object);
  }

  onExpand = (expandedKeys, object) => {
    // Tips: expandedKeys do `NOT` compatible with antd, no leaf nodes are included
    console.log(expandedKeys, object);
  }
}

class Demo extends React.Component {
  onSelect = (keys, event) => {
    console.log('Trigger Select', keys, event);
  };

  onExpand = (a, b) => {
    console.log(a, b);
  };

  render() {
    return (
      <DirectoryTree multiple defaultExpandAll onSelect={this.onSelect} onExpand={this.onExpand}>
        <TreeNode title="parent 0" key="0-0">
          <TreeNode title="leaf 0-0" key="0-0-0" isLeaf />
          <TreeNode title="leaf 0-1" key="0-0-1" isLeaf />
        </TreeNode>
        <TreeNode title="parent 1" key="0-1">
          <TreeNode title="leaf 1-0" key="0-1-0" isLeaf />
          <TreeNode title="leaf 1-1" key="0-1-1" isLeaf />
        </TreeNode>
      </DirectoryTree>
    );
  }
}

export default App;
