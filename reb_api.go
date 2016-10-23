package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"
    "strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

// SimpleChaincode example simple Chaincode implementation
type SimpleChaincode struct {
}


func (t *SimpleChaincode) init(stub *shim.ChaincodeStub, args []string) ([]byte, error) {
    // Initialize the collection of commercial paper keys


	fmt.Println("REB INIT complete")
	fmt.Println("REB INIT complete")
	fmt.Println("REB INIT complete")
	fmt.Println("REB INIT complete")
	return nil, nil
}


func (t *SimpleChaincode) Init(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	if function == "init" {
        fmt.Println("Firing init")
        return t.init(stub, args)
    }
	return nil, nil
}


func (t *SimpleChaincode) Query(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	//need one arg
	return nil, errors.New("Under construction")

}

func (t *SimpleChaincode) Invoke(stub *shim.ChaincodeStub, function string, args []string) ([]byte, error) {
	fmt.Println("run is running " + function)

	return nil, errors.New("Under construction")
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Println("Error starting Simple chaincode: %s", err)
	}
}

