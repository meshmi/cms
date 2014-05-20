var cms = angular.module('cms', ['ngRoute']);

cms.config(function($routeProvider, $locationProvider) {
	$routeProvider
    .when('/auth', { controller: 'Authentication', templateUrl: 'partials/auth.html' })
    .when('/posts', { controller: 'Posts', templateUrl: 'partials/posts.html' })
    .when('/posts/:sha', { controller: 'Post', templateUrl: 'partials/post.html' })
    .otherwise({ redirectTo: '/auth' });
});

cms.controller('Authentication', function Authentication($scope, $rootScope, $location) {
  OAuth.initialize('nOLmdocECLWfvTKz_ftqQWWVgUc');

	$scope.authenticate = function() {
		OAuth.popup('github', function(err, res) {
			if(err) return alert(err);
			$rootScope.github = res;
			$location.path('/posts');
			$scope.$apply();
		});
	};
});

cms.controller('Posts', function Posts($scope, $rootScope) {
  $rootScope.github.get('/repos/movimento-sem-terra/site-novo/contents/_drafts').done(function(data) {
    $rootScope.posts = data;
    $scope.$apply();
  });
});

cms.controller('Post', function Post($scope, $rootScope, $routeParams) {
  var sha = $routeParams.sha;
  $scope.post = findPost(sha);

  $rootScope.github.get(contentPath(sha)).done(function(data) {
    $scope.post.content = parse(data.content);
    $scope.$apply();
  });

  $scope.save = function(post) {
    $rootScope.github.put(filePath(post.name), {
      data: commitData(post)
    }).done(function(data) {
      alert('Post salvo com sucesso!');
    }).fail(function(data) {
      alert('Erro ao salvar post. Tente novamente.');
      console.log('error data:', data);
    });
  };

  function findPost(sha) {
    return $rootScope.posts.filter(function(post) {
      return post.sha == sha;
    }).shift(0);
  }

  function contentPath(sha) {
    return 'https://api.github.com/repos/movimento-sem-terra/site-novo/git/blobs/'+sha;
  }

  function filePath(name) {
    return '/repos/movimento-sem-terra/site-novo/contents/_drafts/'+name;
  }

  function commitData(post) {
    return JSON.stringify({
      sha: post.sha,
      content: compile(post.content),
      message: 'commit from cms'
    });
  }

  function parse(content) {
    var parts = decodeURIComponent(escape(atob(content))).split('---');
    return {
      text: parts.pop(),
      meta: parts.pop()
    };
  }

  function compile(content) {
    return [
      '---',
      content.meta, 
      '---',
      btoa(unescape(encodeURIComponent(content.text)))
    ].join('\n');
  }
});

cms.directive('ckEditor', function() {
  return {
    require : '?ngModel',
    link : function($scope, elm, attr, ngModel) {
      var ck = CKEDITOR.replace(elm[0]);

      ck.on('instanceReady', function() {
        ck.setData(ngModel.$viewValue);
      });

      ck.on('pasteState', function() {
        $scope.$apply(function() {
          ngModel.$setViewValue(ck.getData());
        });
      });

      ngModel.$render = function(value) {
        ck.setData(ngModel.$modelValue);
      };
    }
  };
})
