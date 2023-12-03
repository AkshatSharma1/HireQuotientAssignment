import React, { useState, useEffect} from 'react'
import DataTable from 'react-data-table-component';

import './AdminDash.css'

const AdminDash = () => {

    //State Management
    const [userData, setUserData] = useState([]);
    const [selectedRows, setSelectedRows] = useState([])
    const [editingData, setEditingData] = useState(null)
    const [editRow, setEditRow] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [perPage, setPerPage] = useState(10)
    const [tableKey, setTableKey] = useState(0);
    const [searchPerformed, setSearchPerformed] = useState(false);

      //1. Loading data on refresh 
    const fetchData = async ()=>{
        try {
            const response = await fetch('https://geektrust.s3-ap-southeast-1.amazonaws.com/adminui-problem/members.json')
            const data = await response.json()
            setUserData(data)
            setTotalPages(Math.ceil(data.length/ perPage))
            setSearchPerformed(false);
        } catch (error) {
            console.error('Error in fetching data from the api', error)
        }
    }

    //using async await
    useEffect(()=>{
        fetchData()
    },[perPage])

  //2. Setting up the columns

  const columns = [
    {
        name: 'ID',
        selector: row=>row.id,
        sortable: true
    },
    {
        name: 'Name',
        selector: row=>row.name,
        cell: row=>renderEditableField(row, 'name')
    },
    {
        name: 'Email',
        selector: row=>row.email,
        cell: row=> renderEditableField(row, 'email')
    },
    {
        name: 'Role',
        selector: row=>row.role,
        cell: row=> renderEditableField(row, 'role')
    },
    {
        name: 'Actions',
        selector: row=>row.actions,
        cell: (row)=>(
            <>
            {/* Is editRow set */}
            {editRow === row?
                (<button onClick={()=>handleSave(row)}>Save</button>)
            :
                (<button className='edit-button' onClick={()=>handleEdit(row)}><img width="16" height="16" src="https://img.icons8.com/external-kiranshastry-solid-kiranshastry/64/external-edit-interface-kiranshastry-solid-kiranshastry.png" alt="external-edit-interface-kiranshastry-solid-kiranshastry"/></button>)
            }
            
                <button className='delete-button-small' onClick={()=>handleDelete(row)}><img width="16" height="16" src="https://img.icons8.com/parakeet-line/48/delete.png" alt="delete"/></button>
            </>
        )
    }
  ]

  //We need this component beacuse we cant change the valued directly
  const renderEditableField = (row, field) => {
    return (
      editRow === row ? (
        <input
          type="text"
          value={editingData[field]}
          onChange={(e) => handleFieldChange(field, e.target.value)}
        />
      ) : (
        row[field]
      )
    );
  };

  //2. Handling search functionality

  const SearchComponent = ({ onSearch }) => {
    const [textSearch, setTextSearch] = useState('')
    const handleSearchChange = (event) => {
      setTextSearch(event.target.value);
    };
  
    const handleSearchClick = () => {
      // Pass the searchString to the parent component for search logic
      onSearch(textSearch);
    };
  
    return (
      <div>
        <input
          type="text"
          placeholder="Enter your search"
          value={textSearch}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
        />
        <button className='search-button' onClick={handleSearchClick}>Search</button>
      </div>
    );
  };

  const handleSearch = (searchString) => {
    // Perform the search logic
    
    if(searchString === '' || searchString.trim() === ''){
      setUserData(userData)

      if (searchPerformed) {
        fetchData();
      }
      setSearchPerformed(false);
    }
    else{
      const filteredItems = userData.filter((item) =>
        item.name.toLowerCase().startsWith(searchString.toLowerCase())
      );
      console.log('Filtered Items:', filteredItems);
      setUserData(filteredItems)
      setSearchPerformed(true)
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }


  //3. Handle delete and edit row logic
  const handleDelete = (row)=>{
    alert("Deleting Row")
    //now filter the data and again reset the userData
    const filteredData = userData.filter((user)=>user.id !== row.id)
    setUserData(filteredData)
  }

  const handleEdit = (row)=>{
    alert(`You are editing ${row.name}`)
    setEditRow(row)
    setEditingData({...row})
    setSelectedRows([row])
  }

  const handleSave = ()=>{
    //here change the content
    const updatedContent = userData.map(item=>
        item.id === editRow.id?{...item, ...editingData}:item
    )
    setUserData(updatedContent)
    setEditRow(null) //clear the content of the state
    setEditingData(null)
  }

  const handleFieldChange = (field, value)=>{
    // console.log(editingData);
    // Set row as true for editing 
    setEditingData(prevData=>({
        ...prevData, [field]: value
    }))
    // console.log(editingData);
  }

  //On delete all selected
  const handleDeleteAll = ()=> {
    const updatedData = userData.filter(user=> !selectedRows.includes(user))
    setUserData(updatedData)
    setSelectedRows([])

    setTableKey((prevKey)=>prevKey+1)
  }

  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;

  const visibleData = userData.slice(startIndex, endIndex);

  //pagination
  const generatePageNumbers = ()=>{
    const pageNumbers = []
    for(let i=1;i<=totalPages;i++){
        pageNumbers.push(i)
    }

    return pageNumbers
  }

  return (
    <div className='main'>
        {/* Search Bar */}
        <div className='top-bar'>
            <SearchComponent onSearch={handleSearch} />

            {/* <button className='search-button' onClick={handleSearch}>Search</button> */}
            <button className='delete-button' onClick={()=>handleDeleteAll()}><img width="24" height="24" src="https://img.icons8.com/parakeet-line/48/delete.png" alt="delete"/></button>
        </div>

        {/* Data Table */}
        {/* 
            1. Showing column headers
            2. Filtering and showing data
            3. Selectable data
        
        
        */}
        <DataTable 
            className='data-table'
            columns={columns}
            data={visibleData}
            key={tableKey}
            selectableRows //shows checkboxes
            selectableRowsHighlight

            onSelectAllRows={(rows) => setSelectedRows(rows.map((row) => row.id))}

            onSelectedRowsChange={({ selectedRows }) =>
              setSelectedRows(selectedRows)
            }
        />
        {/* Pagination */}
        <div className='pagination'>
            <span>Selected {selectedRows.length} out of 46 rows</span>
            
            <div className='button-grp'>
                <button
                    onClick={()=>setCurrentPage(1)}
                    disabled={currentPage===1}
                    className='pagi-buttons first-page'
                ><img width="16" height="16" src="https://img.icons8.com/material-outlined/24/double-left.png" alt="double-left"/></button>

                <button
                    onClick={()=>setCurrentPage(currentPage-1)}
                    disabled={currentPage === 1}
                    className='pagi-buttons previous-page'
                ><img width="16" height="16" src="https://img.icons8.com/metro/26/less-than.png" alt="less-than"/></button>

                {generatePageNumbers().map((pageNumber)=>
                    <button
                        key={pageNumber}
                        onClick={()=>setCurrentPage(pageNumber)}
                        className={`pagi-num${pageNumber===currentPage? ' active':''}`}
                    >
                        {pageNumber}
                    </button>
                )}

                <button
                    onClick={()=>setCurrentPage(currentPage+1)}
                    disabled={currentPage===totalPages}
                    className='pagi-buttons next-page'
                ><img width="16" height="16" src="https://img.icons8.com/metro/26/more-than.png" alt="more-than"/></button>

                <button
                    onClick={()=>setCurrentPage(totalPages)}
                    disabled={currentPage===totalPages}
                    className='pagi-buttons last-page'
                ><img width="16" height="16" src="https://img.icons8.com/material-sharp/24/double-right.png" alt="double-left"/></button>
            </div>
        </div>

        
    </div>
  )
}

export default AdminDash