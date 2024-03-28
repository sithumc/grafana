package rest

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	runtime "k8s.io/apimachinery/pkg/runtime"
)

func Create_Test(t *testing.T) {
	var ls = (LegacyStorage)(nil)
	var s = (Storage)(nil)
	lsSpy := NewLegacyStorageSpyClient(ls)
	sSpy := NewStorageSpyClient(s)

	dw := NewDualWriter(lsSpy, sSpy)

	var dummy = (runtime.Object)(nil)

	opts := &metav1.CreateOptions{}

	_, err := dw.Create(context.Background(), dummy, func(context.Context, runtime.Object) error { return nil }, opts)
	assert.NoError(t, err)

	// it should only store data in LegacyStorage when in mode1
	assert.Equal(t, 1, sSpy.Counts("LegacyStorage.Create"))
	assert.Equal(t, 0, sSpy.Counts("Storage.Create"))

	// reset storages
	lsSpy.Reset()
	sSpy.Reset()
}
