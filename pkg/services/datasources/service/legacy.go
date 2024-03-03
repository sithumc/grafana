package service

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/grafana/grafana-plugin-sdk-go/experimental/resource"

	"github.com/grafana/grafana/pkg/infra/appcontext"
	"github.com/grafana/grafana/pkg/services/datasources"
)

// LegacyDataSourceRetriever supports finding a reference to datasources using the name or internal ID
type LegacyDataSourceLookup interface {
	// Find the UID from either the name or internal id
	// NOTE the orgID will be fetched from the context
	GetDataSourceFromDeprecatedFields(ctx context.Context, name string, id int64) (*resource.DataSourceRef, error)
}

var (
	_ DataSourceRetriever    = (*Service)(nil)
	_ LegacyDataSourceLookup = (*cachingLegacyDataSourceLookup)(nil)
	_ LegacyDataSourceLookup = (*NoopLegacyDataSourcLookup)(nil)
)

// NoopLegacyDataSourceRetriever does not even try to lookup, it returns a raw reference
type NoopLegacyDataSourcLookup struct {
	Ref *resource.DataSourceRef
}

func (s *NoopLegacyDataSourcLookup) GetDataSourceFromDeprecatedFields(ctx context.Context, name string, id int64) (*resource.DataSourceRef, error) {
	return s.Ref, nil
}

type cachingLegacyDataSourceLookup struct {
	retriever DataSourceRetriever
	cache     map[string]cachedValue
	cacheMu   sync.Mutex
}

type cachedValue struct {
	ref *resource.DataSourceRef
	err error
}

func ProvideLegacyDataSourceLookup(p *Service) LegacyDataSourceLookup {
	return &cachingLegacyDataSourceLookup{
		retriever: p,
		cache:     make(map[string]cachedValue),
	}
}

func (s *cachingLegacyDataSourceLookup) GetDataSourceFromDeprecatedFields(ctx context.Context, name string, id int64) (*resource.DataSourceRef, error) {
	if id == 0 && name == "" {
		return nil, fmt.Errorf("either name or ID must be set")
	}
	user, err := appcontext.User(ctx)
	if err != nil {
		return nil, err
	}
	key := fmt.Sprintf("%d/%s/%d", user.OrgID, name, id)
	s.cacheMu.Lock()
	defer s.cacheMu.Unlock()

	v, ok := s.cache[key]
	if ok {
		return v.ref, v.err
	}

	ds, err := s.retriever.GetDataSource(ctx, &datasources.GetDataSourceQuery{
		OrgID: user.OrgID,
		Name:  name,
		ID:    id,
	})
	if errors.Is(err, datasources.ErrDataSourceNotFound) && name != "" {
		ds, err = s.retriever.GetDataSource(ctx, &datasources.GetDataSourceQuery{
			OrgID: user.OrgID,
			UID:   name, // Sometimes name is actually the UID :(
		})
	}
	v = cachedValue{
		err: err,
	}
	if ds != nil {
		v.ref = &resource.DataSourceRef{Type: ds.Type, UID: ds.UID}
	}
	return v.ref, v.err
}
