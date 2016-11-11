package main

import (
	"errors"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}


func (t *SimpleChaincode) Init(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	
	fmt.Println("REB INIT complete")
	
	return nil, nil
}


func (t *SimpleChaincode) Query(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	
	data := args[0]
	
	valAsbytes, err := stub.GetState(data)
	if err != nil {
		return nil, errors.New("{\"Error\":\"Failed to get state for " + data + "\"}")
	}

	return valAsbytes, nil
	

	return nil, fmt.Errorf("Error query data [%s]: [%s]",function, string(data))
}

func (t *SimpleChaincode) Invoke(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {

	snils := args[0]
	hash  := args[1]
	
	var err error
	
	err = stub.PutState(snils, []byte(hash))
	if err != nil {
		return nil, fmt.Errorf("Error invoke state. Data [%s]", err)
	}
	
	err = stub.PutState(hash, []byte(snils))
	if err != nil {
		return nil, fmt.Errorf("Error invoke state. Data [%s]", err)
	}
	
	fmt.Println("REB INVOKE complete. DATA: ", string(snils))

	return nil, err
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Println("Error starting Simple chaincode: %s", err)
	}
}

